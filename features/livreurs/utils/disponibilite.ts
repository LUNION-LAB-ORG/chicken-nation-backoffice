/**
 * ÉTAT D'UN LIVREUR AU BACKOFFICE (lot 1 du 22/10 : un livreur en pause ne
 * reçoit plus aucune offre).
 *
 * Le serveur calcule l'état de chaque livreur avec la règle qui décide des
 * offres (champ `disponibilite` de `GET /deliverers` et de
 * `GET /deliverers/live-locations`) : l'écran montre ce que le serveur
 * refuserait, avec ses propres textes.
 *
 * Ce module n'ajoute que ce que le serveur ne peut pas savoir :
 *  - le temps qui passe : une liste chargée à 14 h 31 dit « En pause jusqu'à
 *    14 h 32 » ; à 14 h 33 la pause est finie, et l'état suivant se lit dans
 *    les autres champs, dans le même ordre de priorité que le serveur. Avec
 *    le temps, une pause ne peut que finir : l'état n'est jamais ramené vers
 *    une pause, ce qui protège d'un poste dont l'horloge retarde ;
 *  - la course de la fenêtre « Forcer l'affectation » : un livreur dont
 *    l'offre en attente porte sur CETTE course reste sélectionnable, le
 *    serveur la lui renvoie ;
 *  - un serveur plus ancien, sans `disponibilite` : la carte retombe sur
 *    `availability`, la fenêtre laisse tout sélectionnable comme avant et le
 *    serveur tranche.
 *
 * Heures : celles d'Abidjan, c'est-à-dire UTC, comme le serveur.
 */

import type { IDelivererAvailability } from '../types/deliverer-live.type';
import type { DisponibiliteLivreur, EtatDisponibilite } from '../types/livreur.types';

export interface EtatAffiche {
  etat: EtatDisponibilite;
  /** « Disponible », « En pause jusqu'à 14 h 32 », « Hors service »… */
  libelle: string;
  /** Le serveur accepterait de lui envoyer une offre maintenant. */
  peutRecevoirOffre: boolean;
  /** Raison du refus, texte du serveur (409) ; null si disponible. */
  raison: string | null;
}

/** Ordre d'affichage : d'abord ceux qui peuvent partir. */
export const ORDRE_ETATS: EtatDisponibilite[] = [
  'DISPONIBLE',
  'OFFRE_EN_ATTENTE',
  'EN_COURSE',
  'EN_PAUSE',
  'PAUSE_AUTO',
  'HORS_SERVICE',
  'INACTIF',
];

/** Nom court d'un état (légende, compteurs). */
export const NOM_ETAT: Record<EtatDisponibilite, string> = {
  DISPONIBLE: 'Disponible',
  OFFRE_EN_ATTENTE: 'Offre en attente',
  EN_COURSE: 'En course',
  EN_PAUSE: 'En pause',
  PAUSE_AUTO: 'Pause automatique',
  HORS_SERVICE: 'Hors service',
  INACTIF: 'Inactif',
};

/** Couleurs d'un état : `couleur` pour la pastille et le marqueur, `fond` et `texte` pour l'étiquette. */
export const COULEURS_ETAT: Record<EtatDisponibilite, { couleur: string; fond: string; texte: string }> = {
  DISPONIBLE: { couleur: '#17C964', fond: '#DCFCE7', texte: '#166534' },
  OFFRE_EN_ATTENTE: { couleur: '#7C3AED', fond: '#EDE9FE', texte: '#5B21B6' },
  EN_COURSE: { couleur: '#007AFF', fond: '#DBEAFE', texte: '#1E40AF' },
  EN_PAUSE: { couleur: '#F5A524', fond: '#FEF3C7', texte: '#92400E' },
  PAUSE_AUTO: { couleur: '#EF4444', fond: '#FEE2E2', texte: '#991B1B' },
  HORS_SERVICE: { couleur: '#9CA3AF', fond: '#F3F4F6', texte: '#4B5563' },
  INACTIF: { couleur: '#6B7280', fond: '#E5E7EB', texte: '#374151' },
};

// ============================================================
// HEURES (mêmes textes que le serveur)
// ============================================================

/** Une pause « jusqu'à Reprendre » finit le 31/12/2099 côté serveur : pas d'heure à montrer. */
const FIN_PAUSE_INDEFINIE = Date.parse('2099-12-31T23:59:59Z');
const UN_JOUR = 24 * 3600_000;

const instant = (iso: string | null | undefined): number | null => {
  if (!iso) return null;
  const t = Date.parse(iso);
  return Number.isNaN(t) ? null : t;
};

const estFuture = (iso: string | null | undefined, maintenant: Date): boolean => {
  const t = instant(iso);
  return t !== null && t > maintenant.getTime();
};

/** « 14 h 32 », ou « le 23/10 à 14 h 32 » si ce n'est pas le même jour. */
export function heureLisible(date: Date, maintenant: Date): string {
  const heure = `${date.getUTCHours()} h ${String(date.getUTCMinutes()).padStart(2, '0')}`;
  const memeJour =
    date.getUTCFullYear() === maintenant.getUTCFullYear() &&
    date.getUTCMonth() === maintenant.getUTCMonth() &&
    date.getUTCDate() === maintenant.getUTCDate();
  if (memeJour) return heure;
  const jour = String(date.getUTCDate()).padStart(2, '0');
  const mois = String(date.getUTCMonth() + 1).padStart(2, '0');
  return `le ${jour}/${mois} à ${heure}`;
}

/** Pause « jusqu'à Reprendre » : le serveur la fait finir le 31/12/2099 (pause sans durée, déconnexion). */
export function estPauseSansFin(iso: string | null | undefined): boolean {
  const t = instant(iso);
  return t !== null && t >= FIN_PAUSE_INDEFINIE - UN_JOUR;
}

/** « jusqu'à 14 h 32 », « jusqu'au 23/10 à 14 h 32 », ou rien pour une pause sans fin. */
function jusqua(iso: string | null | undefined, maintenant: Date): string {
  const t = instant(iso);
  if (t === null || estPauseSansFin(iso)) return '';
  const h = heureLisible(new Date(t), maintenant);
  return h.startsWith('le ') ? ` jusqu'au ${h.slice(3)}` : ` jusqu'à ${h}`;
}

type Pauses = Pick<DisponibiliteLivreur, 'pause_until' | 'auto_pause_until'>;

/** Libellé et raison du refus d'un état, avec les textes du serveur. */
function textes(etat: EtatDisponibilite, pauses: Pauses, maintenant: Date): { libelle: string; raison: string | null } {
  switch (etat) {
    case 'DISPONIBLE':
      return { libelle: 'Disponible', raison: null };
    case 'INACTIF':
      return { libelle: 'Inactif', raison: "Ce livreur n'est pas actif ou n'est rattaché à aucun restaurant." };
    case 'EN_PAUSE': {
      const fin = jusqua(pauses.pause_until, maintenant);
      return { libelle: `En pause${fin}`, raison: `Ce livreur est en pause${fin}.` };
    }
    case 'PAUSE_AUTO': {
      const fin = jusqua(pauses.auto_pause_until, maintenant);
      return { libelle: `Pause automatique${fin}`, raison: `Ce livreur est en pause automatique${fin}.` };
    }
    case 'EN_COURSE':
      return { libelle: 'En course', raison: 'Ce livreur a déjà une course en cours.' };
    case 'OFFRE_EN_ATTENTE':
      return { libelle: 'Offre en attente', raison: 'Ce livreur a déjà une offre en attente de réponse.' };
    case 'HORS_SERVICE':
      return {
        libelle: 'Hors service',
        raison: "Ce livreur est hors service : il n'a pas repris le travail dans l'appli.",
      };
  }
}

const construire = (etat: EtatDisponibilite, pauses: Pauses, maintenant: Date): EtatAffiche => ({
  etat,
  ...textes(etat, pauses, maintenant),
  peutRecevoirOffre: etat === 'DISPONIBLE',
});

// ============================================================
// ÉTAT À L'INSTANT
// ============================================================

/**
 * État qui suit la fin d'une pause, dans l'ordre de priorité du serveur
 * (pause, pause automatique, en course, offre en attente, hors service).
 */
function etatApresPause(d: DisponibiliteLivreur, maintenant: Date, verifierPauseAuto: boolean): EtatDisponibilite {
  if (verifierPauseAuto && estFuture(d.auto_pause_until, maintenant)) return 'PAUSE_AUTO';
  if (d.en_course) return 'EN_COURSE';
  if (d.offre_en_attente) return 'OFFRE_EN_ATTENTE';
  if (!d.en_service) return 'HORS_SERVICE';
  return 'DISPONIBLE';
}

/**
 * État du livreur à l'instant `maintenant`, à partir de ce que le serveur a
 * calculé au chargement. Tant que l'état n'a pas bougé, les textes sont ceux
 * du serveur, tels quels.
 */
export function etatLivreur(d: DisponibiliteLivreur, maintenant: Date): EtatAffiche {
  let etat = d.etat;
  if (etat === 'EN_PAUSE' && !estFuture(d.pause_until, maintenant)) {
    etat = etatApresPause(d, maintenant, true);
  } else if (etat === 'PAUSE_AUTO' && !estFuture(d.auto_pause_until, maintenant)) {
    // La pause manuelle passe avant : si le serveur a dit « pause automatique », il n'y en avait pas.
    etat = etatApresPause(d, maintenant, false);
  }

  if (etat !== d.etat || !d.libelle) return construire(etat, d, maintenant);
  return { etat, libelle: d.libelle, peutRecevoirOffre: d.peut_recevoir_offre, raison: d.message_refus };
}

const ETAT_DEPUIS_AVAILABILITY: Record<IDelivererAvailability, EtatDisponibilite> = {
  available: 'DISPONIBLE',
  in_course: 'EN_COURSE',
  paused: 'EN_PAUSE',
  auto_paused: 'PAUSE_AUTO',
  offline: 'HORS_SERVICE',
};

/**
 * État d'un livreur de la carte ou de la liste : la règle du serveur
 * (`disponibilite`), sinon `availability` d'un serveur plus ancien. Null si
 * on ne sait rien (livreur absent de la carte et serveur ancien).
 */
export function etatLivreurAffiche(
  l: {
    disponibilite?: DisponibiliteLivreur | null;
    availability?: IDelivererAvailability | null;
    pause_until?: string | null;
    auto_pause_until?: string | null;
  },
  maintenant: Date,
): EtatAffiche | null {
  if (l.disponibilite) return etatLivreur(l.disponibilite, maintenant);
  if (!l.availability) return null;
  // Valeur inconnue d'un serveur ancien : « hors service », jamais « disponible ».
  const etat = ETAT_DEPUIS_AVAILABILITY[l.availability] ?? 'HORS_SERVICE';
  return construire(
    etat,
    { pause_until: l.pause_until ?? null, auto_pause_until: l.auto_pause_until ?? null },
    maintenant,
  );
}

// ============================================================
// CARTE DES LIVREURS : FILTRES
// ============================================================

export type FiltreCarte = 'TOUS' | 'DISPONIBLE' | 'EN_COURSE' | 'EN_PAUSE' | 'HORS_SERVICE';

export const FILTRES_CARTE: { cle: FiltreCarte; libelle: string }[] = [
  { cle: 'TOUS', libelle: 'Tous' },
  { cle: 'DISPONIBLE', libelle: 'Disponibles' },
  { cle: 'EN_COURSE', libelle: 'En course' },
  { cle: 'EN_PAUSE', libelle: 'En pause' },
  { cle: 'HORS_SERVICE', libelle: 'Hors service' },
];

const FILTRE_DE_L_ETAT: Record<EtatDisponibilite, Exclude<FiltreCarte, 'TOUS'>> = {
  DISPONIBLE: 'DISPONIBLE',
  OFFRE_EN_ATTENTE: 'DISPONIBLE',
  EN_COURSE: 'EN_COURSE',
  EN_PAUSE: 'EN_PAUSE',
  PAUSE_AUTO: 'EN_PAUSE',
  HORS_SERVICE: 'HORS_SERVICE',
  INACTIF: 'HORS_SERVICE',
};

/** « En pause » regroupe la pause et la pause automatique, « Disponibles » ceux qui ont une offre à lire. */
export function correspondAuFiltre(etat: EtatDisponibilite, filtre: FiltreCarte): boolean {
  return filtre === 'TOUS' || FILTRE_DE_L_ETAT[etat] === filtre;
}

/** Rang d'affichage d'un état (0 = en tête). État inconnu : en tête, comme avant. */
export function rangEtat(etat: EtatDisponibilite | null | undefined): number {
  if (!etat) return 0;
  const i = ORDRE_ETATS.indexOf(etat);
  return i === -1 ? ORDRE_ETATS.length : i;
}

// ============================================================
// FENÊTRE « FORCER L'AFFECTATION »
// ============================================================

export interface ChoixAffectation {
  /** Null : serveur plus ancien, état inconnu (le serveur tranchera). */
  etat: EtatDisponibilite | null;
  libelle: string | null;
  /** Peut être choisi ; sinon la ligne est grisée. */
  selectionnable: boolean;
  /** Pourquoi le serveur refuserait (texte du 409), null si sélectionnable. */
  raison: string | null;
  /** Il a déjà l'offre de CETTE course en attente : le serveur la lui renvoie. */
  renvoi: boolean;
}

/**
 * Un livreur dans la fenêtre « Forcer l'affectation » d'une course : même
 * décision que le serveur (`decisionAffectationForcee`), où l'offre en
 * attente sur la course elle-même ne compte pas contre le livreur.
 */
export function choixAffectation(
  d: DisponibiliteLivreur | null | undefined,
  courseId: string,
  maintenant: Date,
): ChoixAffectation {
  if (!d) return { etat: null, libelle: null, selectionnable: true, raison: null, renvoi: false };

  const e = etatLivreur(d, maintenant);
  if (e.etat === 'OFFRE_EN_ATTENTE' && d.offre_course_id === courseId) {
    // Vient ensuite « hors service », dans l'ordre du serveur.
    if (!d.en_service) {
      const h = construire('HORS_SERVICE', d, maintenant);
      return { etat: h.etat, libelle: h.libelle, selectionnable: false, raison: h.raison, renvoi: false };
    }
    return {
      etat: 'OFFRE_EN_ATTENTE',
      libelle: 'Offre en attente sur cette course',
      selectionnable: true,
      raison: null,
      renvoi: true,
    };
  }
  return { etat: e.etat, libelle: e.libelle, selectionnable: e.peutRecevoirOffre, raison: e.raison, renvoi: false };
}

/** Tri de la fenêtre : les livreurs qu'on peut choisir d'abord, puis par état, puis par nom. */
export function comparerPourAffectation(
  a: { choix: ChoixAffectation; nom: string },
  b: { choix: ChoixAffectation; nom: string },
): number {
  if (a.choix.selectionnable !== b.choix.selectionnable) return a.choix.selectionnable ? -1 : 1;
  const ecart = rangEtat(a.choix.etat) - rangEtat(b.choix.etat);
  if (ecart !== 0) return ecart;
  return a.nom.localeCompare(b.nom, 'fr');
}
