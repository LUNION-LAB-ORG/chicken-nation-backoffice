'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Enregistrement d'une note vocale par l'interface native du navigateur.
 *
 * ⚠️ Aucune dépendance ajoutée, volontairement. `MediaRecorder` est présent
 * dans tous les navigateurs visés, et une bibliothèque tierce n'apporterait
 * qu'un poids supplémentaire et une surface de maintenance.
 *
 * ⚠️ Le FORMAT n'est pas le même partout : Chrome produit du webm, Safari du
 * mp4. On ne cherche pas à uniformiser, on déclare simplement au serveur ce
 * qu'on lui envoie. Transcoder exigerait ffmpeg côté serveur, pour un gain nul.
 */

const FORMATS_CANDIDATS = [
  'audio/webm;codecs=opus',
  'audio/webm',
  'audio/mp4',
  'audio/ogg;codecs=opus',
];

function choisirFormat(): string | undefined {
  if (typeof MediaRecorder === 'undefined') return undefined;
  return FORMATS_CANDIDATS.find((f) => MediaRecorder.isTypeSupported(f));
}

export interface VocalEnregistre {
  fichier: File;
  dureeMs: number;
  urlLocale: string;
}

export function useEnregistrementVocal() {
  const [enregistre, setEnregistre] = useState(false);
  const [dureeMs, setDureeMs] = useState(0);
  const [erreur, setErreur] = useState<string | null>(null);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const morceauxRef = useRef<Blob[]>([]);
  const fluxRef = useRef<MediaStream | null>(null);
  const debutRef = useRef<number>(0);
  const minuterieRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const libererLeMicro = useCallback(() => {
    // ⚠️ Sans cet arrêt explicite, la pastille d'enregistrement reste allumée
    // dans l'onglet du navigateur et le micro demeure ouvert.
    fluxRef.current?.getTracks().forEach((piste) => piste.stop());
    fluxRef.current = null;
    if (minuterieRef.current) {
      clearInterval(minuterieRef.current);
      minuterieRef.current = null;
    }
  }, []);

  useEffect(() => libererLeMicro, [libererLeMicro]);

  const demarrer = useCallback(async () => {
    setErreur(null);
    const format = choisirFormat();
    if (!format) {
      setErreur("Ce navigateur ne sait pas enregistrer de note vocale");
      return false;
    }
    try {
      const flux = await navigator.mediaDevices.getUserMedia({ audio: true });
      fluxRef.current = flux;
      morceauxRef.current = [];
      const recorder = new MediaRecorder(flux, { mimeType: format });
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) morceauxRef.current.push(e.data);
      };
      recorderRef.current = recorder;
      debutRef.current = Date.now();
      setDureeMs(0);
      minuterieRef.current = setInterval(
        () => setDureeMs(Date.now() - debutRef.current),
        200,
      );
      recorder.start();
      setEnregistre(true);
      return true;
    } catch {
      // Refus de la permission, ou aucun micro branché.
      setErreur("Micro indisponible. Vérifiez l'autorisation du navigateur.");
      libererLeMicro();
      return false;
    }
  }, [libererLeMicro]);

  /** Arrête et rend le fichier. `null` si rien d'exploitable n'a été capté. */
  const arreter = useCallback((): Promise<VocalEnregistre | null> => {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state === 'inactive') {
      setEnregistre(false);
      return Promise.resolve(null);
    }
    const duree = Date.now() - debutRef.current;
    return new Promise((resoudre) => {
      recorder.onstop = () => {
        libererLeMicro();
        setEnregistre(false);
        const morceaux = morceauxRef.current;
        morceauxRef.current = [];
        if (morceaux.length === 0) return resoudre(null);
        const type = recorder.mimeType || 'audio/webm';
        const blob = new Blob(morceaux, { type });
        // L'extension suit le format réel, pour que le stockage et les
        // lecteurs ne se trompent pas de type.
        const extension = type.includes('mp4') ? 'm4a' : type.includes('ogg') ? 'ogg' : 'webm';
        const fichier = new File([blob], `note-vocale.${extension}`, { type });
        resoudre({ fichier, dureeMs: duree, urlLocale: URL.createObjectURL(blob) });
      };
      recorder.stop();
    });
  }, [libererLeMicro]);

  /** Abandonne sans rien produire. */
  const annuler = useCallback(() => {
    const recorder = recorderRef.current;
    if (recorder && recorder.state !== 'inactive') {
      recorder.onstop = () => libererLeMicro();
      recorder.stop();
    } else {
      libererLeMicro();
    }
    morceauxRef.current = [];
    setEnregistre(false);
    setDureeMs(0);
  }, [libererLeMicro]);

  return { enregistre, dureeMs, erreur, demarrer, arreter, annuler };
}

/** « 1:07 » à partir de millisecondes. */
export function formaterDuree(ms: number) {
  const total = Math.max(0, Math.round(ms / 1000));
  const minutes = Math.floor(total / 60);
  const secondes = total % 60;
  return `${minutes}:${String(secondes).padStart(2, '0')}`;
}
