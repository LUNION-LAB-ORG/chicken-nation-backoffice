/**
 * Moment souhaité par le client, reconstitué depuis `date` et `time`.
 *
 * ⚠️ Doit rester d'accord avec `OrderHelper.momentSouhaite` côté serveur, qui
 * s'en sert pour AUTORISER ou REFUSER le passage en préparation. Un désaccord
 * entre les deux produirait un bouton qui promet ce que le serveur refuse.
 *
 * `date` est une date seule (minuit UTC du jour) et `time` une chaîne
 * « HH:MM ». La Côte d'Ivoire vit à UTC+0 toute l'année, sans heure d'été :
 * l'heure stockée est l'heure de l'horloge murale, les deux se recollent sans
 * conversion.
 *
 * Renvoie `null` à la moindre incertitude, comme le serveur.
 */
export const momentSouhaite = (
  date: string | Date | null | undefined,
  time: string | null | undefined,
): Date | null => {
  if (!date || !time) return null;

  const jour = new Date(date);
  if (Number.isNaN(jour.getTime())) return null;

  const correspondance = /^(\d{1,2})[:hH](\d{2})/.exec(String(time).trim());
  if (!correspondance) return null;

  const heures = Number(correspondance[1]);
  const minutes = Number(correspondance[2]);
  if (!(heures >= 0 && heures <= 23) || !(minutes >= 0 && minutes <= 59)) return null;

  const moment = new Date(jour);
  moment.setUTCHours(heures, minutes, 0, 0);
  return Number.isNaN(moment.getTime()) ? null : moment;
};

/** Avance autorisée sur l'heure souhaitée, identique au serveur. */
export const AVANCE_PREPARATION_MS = 60 * 60 * 1000;

/**
 * Une commande est PROGRAMMÉE quand le moment souhaité s'écarte nettement de
 * sa création.
 *
 * Toutes les commandes portent une date et une heure : sur une commande
 * immédiate, elles valent l'instant de la commande. Les afficher partout ferait
 * du bruit sur chaque ligne et ferait perdre de vue celles qui comptent
 * vraiment. Un quart d'heure d'écart suffit à distinguer les deux.
 */
export const estProgrammee = (
  moment: Date | null,
  creeLe: string | Date | null | undefined,
): boolean => {
  if (!moment || !creeLe) return false;
  const creation = new Date(creeLe);
  if (Number.isNaN(creation.getTime())) return false;
  return moment.getTime() - creation.getTime() > 15 * 60 * 1000;
};
