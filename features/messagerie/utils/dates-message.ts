/**
 * DATES ET HEURES DE LA MESSAGERIE, toujours à l'heure d'Abidjan.
 *
 * Le fuseau est imposé plutôt que pris au navigateur : un responsable en
 * déplacement, ou un poste mal réglé, doit lire l'heure du restaurant, celle à
 * laquelle le client a réellement écrit. Abidjan est à UTC+0 sans heure d'été,
 * donc rien ne change pour les postes sur place.
 *
 * Les fonctions de date-fns (`isToday`, `isYesterday`, `format`) suivent le
 * fuseau du navigateur : elles ne conviennent pas ici.
 *
 * Toutes les fonctions sont pures et tolèrent une date invalide (chaîne vide
 * en retour), pour qu'un message mal formé n'efface pas tout le fil.
 */

export const FUSEAU_MESSAGERIE = 'Africa/Abidjan';

/** Au delà de cet écart, deux messages du même auteur ne sont plus regroupés. */
export const ECART_REGROUPEMENT_MS = 5 * 60 * 1000;

type Instant = string | number | Date | null | undefined;

interface PartiesDate {
  annee: number;
  mois: number;
  jour: number;
  heure: string;
  minute: string;
  jourSemaine: string;
  nomMois: string;
}

const formateurNumerique = new Intl.DateTimeFormat('fr-FR', {
  timeZone: FUSEAU_MESSAGERIE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

const formateurNoms = new Intl.DateTimeFormat('fr-FR', {
  timeZone: FUSEAU_MESSAGERIE,
  weekday: 'long',
  month: 'long',
});

const versDate = (valeur: Instant): Date | null => {
  if (valeur === null || valeur === undefined || valeur === '') return null;
  const date = valeur instanceof Date ? valeur : new Date(valeur);
  return Number.isNaN(date.getTime()) ? null : date;
};

/**
 * Découpage déjà fait, par instant. Le fil entier est redessiné à chaque
 * frappe dans le champ, et chaque bulle demande sa date plusieurs fois (jour,
 * heure, place réservée, date complète) : sans ce cache, un fil de quelques
 * centaines de messages refaisait des milliers de découpages par touche. Le
 * résultat est partagé : personne ne doit le modifier.
 */
const CACHE_PARTIES_MAX = 5000;
const cacheParties = new Map<number, PartiesDate>();

const parties = (valeur: Instant): PartiesDate | null => {
  const date = versDate(valeur);
  if (!date) return null;
  const instant = date.getTime();
  const connu = cacheParties.get(instant);
  if (connu) return connu;
  const calcule = decouper(date);
  if (cacheParties.size >= CACHE_PARTIES_MAX) cacheParties.clear();
  cacheParties.set(instant, calcule);
  return calcule;
};

function decouper(date: Date): PartiesDate {
  const lire = (formateur: Intl.DateTimeFormat) => {
    const table: Record<string, string> = {};
    for (const p of formateur.formatToParts(date)) table[p.type] = p.value;
    return table;
  };
  const n = lire(formateurNumerique);
  const noms = lire(formateurNoms);
  return {
    annee: Number(n.year),
    mois: Number(n.month),
    jour: Number(n.day),
    // Certains moteurs rendent « 24 » pour minuit malgré h23 : on le ramène à 00.
    heure: n.hour === '24' ? '00' : n.hour,
    minute: n.minute,
    jourSemaine: noms.weekday ?? '',
    nomMois: noms.month ?? '',
  };
}

const deuxChiffres = (n: number) => String(n).padStart(2, '0');

const cleDepuisParties = (p: { annee: number; mois: number; jour: number }) =>
  `${p.annee}-${deuxChiffres(p.mois)}-${deuxChiffres(p.jour)}`;

/**
 * Clé du jour qui PRÉCÈDE une date (à Abidjan). Calcul sur le calendrier, pas
 * en retranchant 24 heures, pour rester juste quel que soit le fuseau.
 */
const cleVeille = (p: PartiesDate) => {
  const veille = new Date(Date.UTC(p.annee, p.mois - 1, p.jour - 1));
  return cleDepuisParties({
    annee: veille.getUTCFullYear(),
    mois: veille.getUTCMonth() + 1,
    jour: veille.getUTCDate(),
  });
};

type Proximite = 'aujourdhui' | 'hier' | 'avant';

const proximite = (p: PartiesDate, maintenant: PartiesDate): Proximite => {
  const cle = cleDepuisParties(p);
  if (cle === cleDepuisParties(maintenant)) return 'aujourdhui';
  if (cle === cleVeille(maintenant)) return 'hier';
  return 'avant';
};

const majuscule = (texte: string) => (texte ? texte.charAt(0).toUpperCase() + texte.slice(1) : texte);

/** « 18:26 ». */
export const heureMessage = (valeur: Instant): string => {
  const p = parties(valeur);
  return p ? `${p.heure}:${p.minute}` : '';
};

/** « 2026-09-26 », le jour tel qu'on le vit à Abidjan. Sert à couper le fil par jour. */
export const cleJour = (valeur: Instant): string => {
  const p = parties(valeur);
  return p ? cleDepuisParties(p) : '';
};

/**
 * « samedi 26 septembre 2026 », sans l'heure. Le premier du mois s'écrit
 * « 1er », comme en français courant (Intl ne le fait pas).
 */
const dateLongue = (p: PartiesDate) =>
  `${p.jourSemaine} ${p.jour === 1 ? '1er' : p.jour} ${p.nomMois} ${p.annee}`;

/** « samedi 26 septembre 2026 à 18:26 » : affichée au survol et lue par les lecteurs d'écran. */
export const dateHeureComplete = (valeur: Instant): string => {
  const p = parties(valeur);
  return p ? `${dateLongue(p)} à ${p.heure}:${p.minute}` : '';
};

/** « 26/09/2026 à 18:26 ». */
export const dateHeureCourte = (valeur: Instant): string => {
  const p = parties(valeur);
  return p ? `${deuxChiffres(p.jour)}/${deuxChiffres(p.mois)}/${p.annee} à ${p.heure}:${p.minute}` : '';
};

/**
 * « 24/09 », ou « 24/09/2025 » quand l'année n'est pas celle d'aujourd'hui :
 * sans elle, un message de l'an dernier passerait pour un message de la semaine.
 */
const jourMois = (p: PartiesDate, maintenant: PartiesDate) =>
  p.annee === maintenant.annee
    ? `${deuxChiffres(p.jour)}/${deuxChiffres(p.mois)}`
    : `${deuxChiffres(p.jour)}/${deuxChiffres(p.mois)}/${p.annee}`;

/** Séparateur de jour : « Aujourd'hui », « Hier » ou « Jeudi 24 septembre 2026 ». */
export const libelleJour = (valeur: Instant, maintenant: Instant = new Date()): string => {
  const p = parties(valeur);
  const m = parties(maintenant);
  if (!p || !m) return '';
  const proche = proximite(p, m);
  if (proche === 'aujourdhui') return "Aujourd'hui";
  if (proche === 'hier') return 'Hier';
  return majuscule(dateLongue(p));
};

/**
 * Date et heure écrites DANS chaque bulle : « Aujourd'hui 18:26 »,
 * « Hier 18:26 », « 24/09 18:26 », « 24/09/2025 18:26 ».
 */
export const horodatageBulle = (valeur: Instant, maintenant: Instant = new Date()): string => {
  const p = parties(valeur);
  const m = parties(maintenant);
  if (!p || !m) return '';
  const heure = `${p.heure}:${p.minute}`;
  const proche = proximite(p, m);
  if (proche === 'aujourdhui') return `Aujourd'hui ${heure}`;
  if (proche === 'hier') return `Hier ${heure}`;
  return `${jourMois(p, m)} ${heure}`;
};

/** Accusé de lecture : « Vu à 18:26 », « Vu hier à 18:26 », « Vu le 24/09 à 18:26 ». */
export const libelleVu = (valeur: Instant, maintenant: Instant = new Date()): string => {
  const p = parties(valeur);
  const m = parties(maintenant);
  if (!p || !m) return 'Vu';
  const heure = `${p.heure}:${p.minute}`;
  const proche = proximite(p, m);
  if (proche === 'aujourdhui') return `Vu à ${heure}`;
  if (proche === 'hier') return `Vu hier à ${heure}`;
  return `Vu le ${jourMois(p, m)} à ${heure}`;
};

/**
 * Deux messages sont-ils assez proches pour partager un en-tête (avatar et
 * nom) ? Au delà de cinq minutes, non : chacun garde de toute façon sa propre
 * heure dans sa bulle.
 */
export const dansLaFenetreDeRegroupement = (precedent: Instant, courant: Instant): boolean => {
  const a = versDate(precedent);
  const b = versDate(courant);
  if (!a || !b) return false;
  return Math.abs(b.getTime() - a.getTime()) <= ECART_REGROUPEMENT_MS;
};

/**
 * Millisecondes jusqu'au prochain minuit à Abidjan (au moins une seconde).
 * Sert à rafraîchir « Aujourd'hui » et « Hier » sans horloge qui tourne.
 */
export const msAvantProchainJour = (maintenant: Instant = new Date()): number => {
  const date = versDate(maintenant);
  const p = parties(date);
  if (!date || !p) return 60 * 60 * 1000;
  const ecoule =
    (Number(p.heure) * 60 + Number(p.minute)) * 60 * 1000 +
    date.getUTCSeconds() * 1000 +
    date.getUTCMilliseconds();
  return Math.max(1000, 24 * 60 * 60 * 1000 - ecoule + 500);
};
