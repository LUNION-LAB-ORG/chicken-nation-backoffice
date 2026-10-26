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
 *    serveur tranche ;
 *  - l'appli du livreur (demande du 24/10) : « Appli fermée, vue il y a
 *    6 min », « En arrière-plan » (offres par notification), d'après
 *    `appli_active`, `appli_vue_a` et `appli_connectee` du serveur ;
 *  - depuis le retour du client du 25/10 : « Connexion coupée · depuis
 *    4 min » pour une appli silencieuse sans preuve de fermeture
 *    (`appli_etat` du serveur). « Appli fermée » seulement sur cette preuve.
 *
 * Heures : celles d'Abidjan, c'est-à-dire UTC, comme le serveur.
 */

import type { IDelivererAvailability } from '../types/deliverer-live.type';
import type {
  DisponibiliteLivreur,
  EtatAppliServeur,
  EtatDisponibilite,
  PresenceAppliServeur,
} from '../types/livreur.types';

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
  'EN_APPEL',
  'EN_COURSE',
  'EN_PAUSE',
  'PAUSE_AUTO',
  'CONNEXION_COUPEE',
  'INJOIGNABLE',
  'APPLI_FERMEE',
  'HORS_SERVICE',
  'INACTIF',
];

/** Nom court d'un état (légende, compteurs). */
export const NOM_ETAT: Record<EtatDisponibilite, string> = {
  DISPONIBLE: 'Disponible',
  OFFRE_EN_ATTENTE: 'Offre en attente',
  EN_APPEL: 'En appel',
  EN_COURSE: 'En course',
  EN_PAUSE: 'En pause',
  PAUSE_AUTO: 'Pause automatique',
  HORS_SERVICE: 'Hors service',
  INACTIF: 'Inactif',
  APPLI_FERMEE: 'Appli fermée',
  CONNEXION_COUPEE: 'Connexion coupée',
  INJOIGNABLE: 'Injoignable',
};

const COULEURS_DISPONIBLE = { couleur: '#17C964', fond: '#DCFCE7', texte: '#166534' };
const COULEURS_SILENCE = { couleur: '#B45309', fond: '#FFFBEB', texte: '#B45309' };

/**
 * Couleurs d'un état : `couleur` pour la pastille et le marqueur, `fond` et
 * `texte` pour l'étiquette. « En appel » prend celle des disponibles (aucune
 * nouvelle couleur) : le serveur le compte avec eux.
 */
export const COULEURS_ETAT: Record<EtatDisponibilite, { couleur: string; fond: string; texte: string }> = {
  DISPONIBLE: COULEURS_DISPONIBLE,
  EN_APPEL: COULEURS_DISPONIBLE,
  OFFRE_EN_ATTENTE: { couleur: '#7C3AED', fond: '#EDE9FE', texte: '#5B21B6' },
  EN_COURSE: { couleur: '#007AFF', fond: '#DBEAFE', texte: '#1E40AF' },
  EN_PAUSE: { couleur: '#F5A524', fond: '#FEF3C7', texte: '#92400E' },
  PAUSE_AUTO: { couleur: '#EF4444', fond: '#FEE2E2', texte: '#991B1B' },
  HORS_SERVICE: { couleur: '#9CA3AF', fond: '#F3F4F6', texte: '#4B5563' },
  INACTIF: { couleur: '#6B7280', fond: '#E5E7EB', texte: '#374151' },
  APPLI_FERMEE: { couleur: '#64748B', fond: '#E2E8F0', texte: '#334155' },
  // Ambre d'« Appli non connectée » : l'appli ne répond plus, sans preuve qu'elle est fermée.
  CONNEXION_COUPEE: COULEURS_SILENCE,
  INJOIGNABLE: COULEURS_SILENCE,
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
    case 'EN_APPEL':
      return { libelle: NOM_ETAT.EN_APPEL, raison: 'Ce livreur est en appel avec le call center.' };
    case 'HORS_SERVICE':
      return {
        libelle: 'Hors service',
        raison: "Ce livreur est hors service : il n'a pas repris le travail dans l'appli.",
      };
    case 'APPLI_FERMEE':
      return { libelle: NOM_ETAT.APPLI_FERMEE, raison: REFUS_APPLI_FERMEE };
    case 'CONNEXION_COUPEE':
      return { libelle: NOM_ETAT.CONNEXION_COUPEE, raison: REFUS_CONNEXION_COUPEE };
    case 'INJOIGNABLE':
      return { libelle: NOM_ETAT.INJOIGNABLE, raison: REFUS_INJOIGNABLE };
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
 * « Appli fermée », qui vient ensuite, est vu par `etatLivreur`.
 */
function etatApresPause(d: DisponibiliteLivreur, maintenant: Date, verifierPauseAuto: boolean): EtatDisponibilite {
  if (verifierPauseAuto && estFuture(d.auto_pause_until, maintenant)) return 'PAUSE_AUTO';
  if (d.en_course) return 'EN_COURSE';
  if (d.offre_en_attente) return 'OFFRE_EN_ATTENTE';
  if (!d.en_service) return 'HORS_SERVICE';
  return 'DISPONIBLE';
}

/**
 * État envoyé par le serveur, ramené aux états de cet écran (règle commune à
 * Commandes, Livreurs, « Aujourd'hui » et En direct) : un état que ce
 * backoffice ne connaît pas (serveur déployé après lui) devient « Hors
 * service », jamais « Disponible ». « Injoignable » est connu depuis le
 * 25/10 : il n'est plus rangé avec les applis fermées.
 */
export function etatConnu(etat: string | null | undefined): EtatDisponibilite {
  return etat && Object.hasOwn(COULEURS_ETAT, etat) ? (etat as EtatDisponibilite) : 'HORS_SERVICE';
}

/**
 * État d'un livreur que le serveur dirait disponible mais dont l'appli ne
 * répond plus : « Appli fermée » sur la preuve du serveur seulement, sinon
 * « Connexion coupée » (serveur plus ancien compris).
 */
function etatSilence(appliEtat: EtatAppliServeur | null | undefined): 'APPLI_FERMEE' | 'CONNEXION_COUPEE' {
  return appliEtat === 'FERMEE' ? 'APPLI_FERMEE' : 'CONNEXION_COUPEE';
}

/**
 * « Appli fermée » envoyé par le serveur, gardé seulement avec sa preuve
 * (`appli_etat` FERMEE). Relecture du 26/10 : un serveur d'avant le 25/10
 * (sans `appli_etat`) envoie cet état pour tout silence ; il devient
 * « Connexion coupée », comme pour un livreur en course dans le même silence.
 */
function etatPreuve(etat: EtatDisponibilite, appliEtat: EtatAppliServeur | null | undefined): EtatDisponibilite {
  return etat === 'APPLI_FERMEE' ? etatSilence(appliEtat) : etat;
}

/**
 * État du livreur à l'instant `maintenant`, à partir de ce que le serveur a
 * calculé au chargement. Tant que l'état n'a pas bougé, les textes sont ceux
 * du serveur, tels quels.
 *
 * `appliActive` et `appliEtat` : `appli_active` et `appli_etat` du livreur
 * (à côté de `disponibilite` ou dedans). Un livreur qui serait disponible
 * mais dont l'appli ne répond plus est « Appli fermée » (preuve du serveur)
 * ou « Connexion coupée » : le serveur refuserait l'offre (409).
 */
export function etatLivreur(
  d: DisponibiliteLivreur,
  maintenant: Date,
  appliActive: boolean | null | undefined = d.appli_active,
  appliEtat: EtatAppliServeur | null | undefined = d.appli_etat,
): EtatAffiche {
  // État que cet écran ne connaît pas (état d'un serveur plus récent) :
  // ramené par `etatConnu`, avec le texte du serveur.
  // Sans cela, la liste et la carte plantaient faute de couleurs pour cet état.
  if (!Object.hasOwn(COULEURS_ETAT, d.etat)) {
    const etat = etatConnu(d.etat);
    return {
      etat,
      libelle: d.libelle || NOM_ETAT[etat],
      peutRecevoirOffre: false,
      raison: d.message_refus,
    };
  }
  let etat = etatPreuve(d.etat, appliEtat);
  if (etat === 'EN_PAUSE' && !estFuture(d.pause_until, maintenant)) {
    etat = etatApresPause(d, maintenant, true);
  } else if (etat === 'PAUSE_AUTO' && !estFuture(d.auto_pause_until, maintenant)) {
    // La pause manuelle passe avant : si le serveur a dit « pause automatique », il n'y en avait pas.
    etat = etatApresPause(d, maintenant, false);
  }
  // L'appli silencieuse passe avant l'appel, comme au serveur.
  if ((etat === 'DISPONIBLE' || etat === 'EN_APPEL') && appliActive === false) etat = etatSilence(appliEtat);

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
    appli_active?: boolean | null;
    appli_etat?: EtatAppliServeur | null;
  },
  maintenant: Date,
): EtatAffiche | null {
  if (l.disponibilite) return etatLivreur(l.disponibilite, maintenant, appliActiveDe(l), appliEtatDe(l));
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

export type FiltreCarte =
  | 'TOUS'
  | 'DISPONIBLE'
  | 'EN_COURSE'
  | 'EN_PAUSE'
  | 'CONNEXION_COUPEE'
  | 'APPLI_FERMEE'
  | 'HORS_SERVICE';

export const FILTRES_CARTE: { cle: FiltreCarte; libelle: string }[] = [
  { cle: 'TOUS', libelle: 'Tous' },
  { cle: 'DISPONIBLE', libelle: 'Disponibles' },
  { cle: 'EN_COURSE', libelle: 'En course' },
  { cle: 'EN_PAUSE', libelle: 'En pause' },
  { cle: 'CONNEXION_COUPEE', libelle: 'Connexion coupée' },
  { cle: 'APPLI_FERMEE', libelle: 'Appli fermée' },
  { cle: 'HORS_SERVICE', libelle: 'Hors service' },
];

const FILTRE_DE_L_ETAT: Record<EtatDisponibilite, Exclude<FiltreCarte, 'TOUS'>> = {
  DISPONIBLE: 'DISPONIBLE',
  OFFRE_EN_ATTENTE: 'DISPONIBLE',
  EN_APPEL: 'DISPONIBLE',
  EN_COURSE: 'EN_COURSE',
  EN_PAUSE: 'EN_PAUSE',
  PAUSE_AUTO: 'EN_PAUSE',
  HORS_SERVICE: 'HORS_SERVICE',
  INACTIF: 'HORS_SERVICE',
  APPLI_FERMEE: 'APPLI_FERMEE',
  CONNEXION_COUPEE: 'CONNEXION_COUPEE',
  INJOIGNABLE: 'CONNEXION_COUPEE',
};

/**
 * « En pause » regroupe la pause et la pause automatique, « Disponibles » ceux
 * qui ont une offre à lire ou sont en appel, « Connexion coupée » les
 * coupures et les injoignables (aucune offre ne leur parvient).
 */
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
  appliActive: boolean | null | undefined = d?.appli_active,
  appliEtat: EtatAppliServeur | null | undefined = d?.appli_etat,
): ChoixAffectation {
  if (!d) return { etat: null, libelle: null, selectionnable: true, raison: null, renvoi: false };

  const e = etatLivreur(d, maintenant, appliActive, appliEtat);
  if (e.etat === 'OFFRE_EN_ATTENTE' && d.offre_course_id === courseId) {
    // Viennent ensuite « hors service » puis l'appli silencieuse, dans l'ordre du serveur.
    const suivant = !d.en_service ? 'HORS_SERVICE' : appliActive === false ? etatSilence(appliEtat) : null;
    if (suivant) {
      const h = construire(suivant, d, maintenant);
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

// ============================================================
// APPLI DU LIVREUR : FERMÉE, COUPÉE, EN ARRIÈRE-PLAN, NON CONNECTÉE
// ============================================================

/**
 * Demande du 24/10 : l'appli du livreur reste active en arrière-plan ou
 * téléphone verrouillé (positions envoyées, offres par notification) ; une
 * fois FERMÉE (glissée hors de la liste des applis), le serveur ne lui
 * propose plus rien jusqu'à ce qu'il la rouvre, sans pause ni pénalité.
 *
 * Retour du client du 25/10 : appli pas fermée, affichée « Appli fermée ».
 * Le serveur garde désormais la raison de la fin de la connexion et dit
 * `appli_etat` : `FERMEE` quand l'appli a fermé elle-même sa connexion,
 * `COUPURE` pour tout autre silence (réseau coupé, téléphone qui bloque
 * l'appli). Les effets sont les mêmes ; seuls le mot et la couleur changent.
 *
 * Le serveur dit, pour chaque livreur :
 *  - `appli_connectee` : connexion temps réel ouverte (offre à l'écran) ;
 *  - `appli_active` : connexion ouverte OU signal récent (position, requête)
 *    depuis moins de `deliverer.appli_fermee_apres_s` secondes ;
 *  - `appli_etat` : `ACTIVE`, `FERMEE` ou `COUPURE` (serveur du 25/10) ;
 *  - `appli_vue_a` : heure du dernier signal.
 *
 * Quatre cas à signaler :
 *  - « Appli fermée » (gris, « vue il y a 6 min ») : fermeture prouvée ;
 *  - « Connexion coupée » (ambre, « depuis 4 min ») : tout autre silence, et
 *    tout doute (serveur plus ancien sans `appli_etat`) ;
 *  - « En arrière-plan » : appli active sans connexion temps réel, l'offre
 *    lui arrive par notification ;
 *  - « Appli non connectée » : sans connexion, et un serveur plus ancien qui
 *    ne dit pas si l'appli tourne encore (cas du 23/10, inchangé).
 */

/** Texte du refus (409) du serveur pour une appli fermée. */
export const REFUS_APPLI_FERMEE = "L'appli de ce livreur est fermée.";
/** Texte du refus (409) du serveur pour une connexion coupée. */
export const REFUS_CONNEXION_COUPEE = 'La connexion de ce livreur est coupée : son appli ne répond plus.';
/** Texte du refus (409) du serveur pour un livreur injoignable. */
export const REFUS_INJOIGNABLE = 'Ce livreur est injoignable : ni appli connectée, ni notifications.';

export const LIBELLE_APPLI_FERMEE = NOM_ETAT.APPLI_FERMEE;
export const LIBELLE_APPLI_COUPEE = NOM_ETAT.CONNEXION_COUPEE;
export const LIBELLE_APPLI_ARRIERE_PLAN = 'En arrière-plan';
export const LIBELLE_APPLI_NON_CONNECTEE = 'Appli non connectée';

export const RAISON_APPLI_FERMEE =
  "L'appli de ce livreur est fermée : ni offre ni position tant qu'il ne la rouvre pas.";
export const RAISON_APPLI_ARRIERE_PLAN =
  "L'appli du livreur tourne en arrière-plan : une offre lui arrive par notification.";
export const RAISON_APPLI_NON_CONNECTEE =
  "L'appli du livreur n'est pas connectée en temps réel : une offre ne lui arrive que par notification. " +
  "Demandez-lui de rouvrir l'appli.";

export type CasAppli = 'FERMEE' | 'COUPURE' | 'ARRIERE_PLAN' | 'NON_CONNECTEE';

export interface PresenceAppli {
  cas: CasAppli;
  /** « Appli fermée », « Connexion coupée », « En arrière-plan », « Appli non connectée ». */
  libelle: string;
  /**
   * « vue il y a 6 min » (appli fermée), « depuis 4 min » (connexion coupée)
   * quand le dernier signal est connu, sinon null.
   */
  vue: string | null;
  /** Explication (infobulle, fenêtre « Forcer l'affectation »). */
  raison: string;
}

/** Couleurs d'un cas : texte, fond et bordure (gris pour une appli fermée, ambre pour une coupure). */
export const COULEURS_PRESENCE: Record<CasAppli, { texte: string; fond: string; bord: string }> = {
  FERMEE: { texte: '#475569', fond: '#F1F5F9', bord: '#CBD5E1' },
  COUPURE: { texte: '#B45309', fond: '#FFFBEB', bord: '#FDE68A' },
  ARRIERE_PLAN: { texte: '#0369A1', fond: '#F0F9FF', bord: '#BAE6FD' },
  NON_CONNECTEE: { texte: '#B45309', fond: '#FFFBEB', bord: '#FDE68A' },
};

/** Ce que l'écran lit d'un livreur : les champs du serveur, à côté de `disponibilite` ou dedans. */
export interface SourcePresence extends PresenceAppliServeur {
  appli_connectee?: boolean | null;
  disponibilite?: PresenceAppliServeur | null;
}

/** `appli_active` du livreur, à côté de `disponibilite` ou dedans ; undefined si le serveur ne la donne pas. */
export function appliActiveDe(l: SourcePresence): boolean | null | undefined {
  return l.appli_active ?? l.disponibilite?.appli_active;
}

/** `appli_etat` du livreur, à côté de `disponibilite` ou dedans ; undefined sur un serveur plus ancien. */
export function appliEtatDe(l: SourcePresence): EtatAppliServeur | null | undefined {
  return l.appli_etat ?? l.disponibilite?.appli_etat;
}

/** `appli_vue_a` du livreur, à côté de `disponibilite` ou dedans. */
export function appliVueADe(l: SourcePresence): string | null {
  return l.appli_vue_a ?? l.disponibilite?.appli_vue_a ?? null;
}

/**
 * « vue à l'instant », « vue il y a 6 min », « vue à 14 h 32 » (plus d'une
 * heure, même jour), « vue le 23/10 à 14 h 32 ». Null si l'heure est inconnue.
 */
export function vueIlYa(iso: string | null | undefined, maintenant: Date): string | null {
  const t = instant(iso);
  if (t === null) return null;
  const minutes = Math.floor((maintenant.getTime() - t) / 60_000);
  // Horloge du poste en retard sur le serveur : « à l'instant », jamais « dans 2 min ».
  if (minutes < 1) return "vue à l'instant";
  if (minutes < 60) return `vue il y a ${minutes} min`;
  const h = heureLisible(new Date(t), maintenant);
  return h.startsWith('le ') ? `vue ${h}` : `vue à ${h}`;
}

/**
 * Connexion coupée depuis le dernier signal : « depuis 4 min », « depuis
 * 17 h 31 » (plus d'une heure, même jour), « depuis le 24/10 à 17 h 31 ».
 * Null si l'heure est inconnue.
 */
export function depuisLisible(iso: string | null | undefined, maintenant: Date): string | null {
  const t = instant(iso);
  if (t === null) return null;
  const minutes = Math.floor((maintenant.getTime() - t) / 60_000);
  // Horloge du poste en retard sur le serveur : jamais une durée négative.
  if (minutes < 1) return "depuis moins d'1 min";
  if (minutes < 60) return `depuis ${minutes} min`;
  return `depuis ${heureLisible(new Date(t), maintenant)}`;
}

/** « Plus de nouvelles de son appli depuis 17 h 31 : réseau coupé, ou téléphone qui bloque l'appli. … » */
export function raisonConnexionCoupee(iso: string | null | undefined, maintenant: Date): string {
  const t = instant(iso);
  const depuis = t === null ? '' : ` depuis ${heureLisible(new Date(t), maintenant)}`;
  return `Plus de nouvelles de son appli${depuis} : réseau coupé, ou téléphone qui bloque l'appli. Aucune offre jusqu'à son retour.`;
}

/** États où l'appli doit tourner : il peut recevoir une offre, ou il livre. */
const ETATS_APPLI_ATTENDUE: ReadonlySet<EtatDisponibilite> = new Set<EtatDisponibilite>([
  'DISPONIBLE',
  'OFFRE_EN_ATTENTE',
  'EN_COURSE',
]);

/**
 * L'appli du livreur, à signaler ou non. Signalée seulement quand le serveur
 * l'affirme et que le livreur est en service : en pause, hors service,
 * inactif ou injoignable (sa pastille le dit), rien ; présence inconnue
 * (`null`) ou serveur plus ancien (absente) : rien.
 *
 * Ordre de lecture (conception du 25/10) : fermeture prouvée (`appli_etat`
 * `FERMEE`, avec ou sans l'état « Appli fermée »), puis coupure (`appli_etat`
 * `COUPURE`, état « Connexion coupée », état « Appli fermée » sans
 * `appli_etat` d'un serveur plus ancien, ou `appli_active` faux sans
 * `appli_etat`). `appli_active` vrai : jamais l'une ni l'autre.
 */
export function presenceAppli(
  l: SourcePresence,
  etat: EtatDisponibilite | null | undefined,
  maintenant: Date,
): PresenceAppli | null {
  if (!etat) return null;
  const fermee = (): PresenceAppli => ({
    cas: 'FERMEE',
    libelle: LIBELLE_APPLI_FERMEE,
    vue: vueIlYa(appliVueADe(l), maintenant),
    raison: RAISON_APPLI_FERMEE,
  });
  const coupure = (): PresenceAppli => ({
    cas: 'COUPURE',
    libelle: LIBELLE_APPLI_COUPEE,
    vue: depuisLisible(appliVueADe(l), maintenant),
    raison: raisonConnexionCoupee(appliVueADe(l), maintenant),
  });
  // Le serveur l'a déjà classé : on ajoute l'heure. « Appli fermée » sans sa
  // preuve (serveur d'avant le 25/10) : coupure.
  if (etat === 'APPLI_FERMEE') return appliEtatDe(l) === 'FERMEE' ? fermee() : coupure();
  if (etat === 'CONNEXION_COUPEE') return coupure();
  if (!ETATS_APPLI_ATTENDUE.has(etat)) return null;
  // Connexion temps réel ouverte : l'offre s'affiche à l'écran, rien à dire.
  if (l.appli_connectee === true) return null;
  const active = appliActiveDe(l);
  if (active !== true) {
    const appliEtat = appliEtatDe(l);
    if (appliEtat === 'FERMEE') return fermee();
    // Sans preuve de fermeture (serveur plus ancien compris) : coupure, jamais « Appli fermée ».
    if (appliEtat === 'COUPURE' || active === false) return coupure();
  }
  if (l.appli_connectee !== false) return null;
  if (active === true) {
    return { cas: 'ARRIERE_PLAN', libelle: LIBELLE_APPLI_ARRIERE_PLAN, vue: null, raison: RAISON_APPLI_ARRIERE_PLAN };
  }
  return { cas: 'NON_CONNECTEE', libelle: LIBELLE_APPLI_NON_CONNECTEE, vue: null, raison: RAISON_APPLI_NON_CONNECTEE };
}

/** « Appli fermée · vue il y a 6 min », « Connexion coupée · depuis 4 min », « En arrière-plan ». */
export function libellePresence(p: Pick<PresenceAppli, 'libelle' | 'vue'>): string {
  return p.vue ? `${p.libelle} · ${p.vue}` : p.libelle;
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
