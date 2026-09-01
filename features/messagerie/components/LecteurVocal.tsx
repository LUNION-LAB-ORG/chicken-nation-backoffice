'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Pause, Play } from 'lucide-react';
import { formaterDuree } from '../hooks/use-enregistrement-vocal';

/**
 * Lecteur d'une note vocale dans une bulle de conversation.
 *
 * ⚠️ Pas de `<audio controls>` nu : le lecteur natif impose sa propre largeur
 * et son propre style, impossible à accorder aux bulles. On garde l'élément
 * audio, invisible, et on pilote nous mêmes lecture et progression.
 *
 * La durée annoncée par le serveur sert de repli : sur un enregistrement en
 * flux continu, certains navigateurs renvoient une durée infinie tant que le
 * fichier n'est pas entièrement parcouru.
 */
export default function LecteurVocal({
  url,
  dureeMs,
  sombre,
}: {
  url: string;
  dureeMs?: number | null;
  sombre?: boolean;
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [enLecture, setEnLecture] = useState(false);
  const [positionMs, setPositionMs] = useState(0);
  const [dureeReelleMs, setDureeReelleMs] = useState<number | null>(dureeMs ?? null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const surTemps = () => setPositionMs(audio.currentTime * 1000);
    const surMeta = () => {
      if (Number.isFinite(audio.duration) && audio.duration > 0) {
        setDureeReelleMs(audio.duration * 1000);
      }
    };
    const surFin = () => {
      setEnLecture(false);
      setPositionMs(0);
    };
    audio.addEventListener('timeupdate', surTemps);
    audio.addEventListener('loadedmetadata', surMeta);
    audio.addEventListener('durationchange', surMeta);
    audio.addEventListener('ended', surFin);
    return () => {
      audio.removeEventListener('timeupdate', surTemps);
      audio.removeEventListener('loadedmetadata', surMeta);
      audio.removeEventListener('durationchange', surMeta);
      audio.removeEventListener('ended', surFin);
    };
  }, []);

  const basculer = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (enLecture) {
      audio.pause();
      setEnLecture(false);
      return;
    }
    void audio.play().then(() => setEnLecture(true)).catch(() => setEnLecture(false));
  };

  const total = dureeReelleMs ?? dureeMs ?? 0;
  const avancement = total > 0 ? Math.min(100, (positionMs / total) * 100) : 0;
  const restant = enLecture || positionMs > 0 ? Math.max(0, total - positionMs) : total;

  return (
    <div className="flex items-center gap-2.5 px-3 py-2.5 min-w-[190px]">
      <audio ref={audioRef} src={url} preload="metadata" className="hidden" />
      <button
        type="button"
        onClick={basculer}
        title={enLecture ? 'Mettre en pause' : 'Écouter la note vocale'}
        className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
          sombre ? 'bg-white/20 hover:bg-white/30 text-white' : 'bg-[#F17922]/10 hover:bg-[#F17922]/20 text-[#F17922]'
        }`}
      >
        {enLecture ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
      </button>
      <div className="flex-1 min-w-[90px]">
        <div className={`h-1 rounded-full overflow-hidden ${sombre ? 'bg-white/25' : 'bg-gray-200'}`}>
          <div
            className={`h-full rounded-full transition-[width] duration-150 ${sombre ? 'bg-white' : 'bg-[#F17922]'}`}
            style={{ width: `${avancement}%` }}
          />
        </div>
      </div>
      <span className={`text-[11px] tabular-nums shrink-0 ${sombre ? 'text-white/80' : 'text-gray-500'}`}>
        {formaterDuree(restant)}
      </span>
    </div>
  );
}
