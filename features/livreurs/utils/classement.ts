/**
 * CLASSEMENT ET FILE SUR LA FICHE DU LIVREUR.
 *
 * Mots connus des équipes, ceux d'avant le 24/10 (demande du client du
 * 25/10) : « Position dans la file » (place par le score, « #3 / 5
 * candidats »), « Rang FIFO pur » (ordre d'arrivée dans la file, « #2 »),
 * composante « File FIFO » du score.
 */

export const LIBELLE_CLASSEMENT = 'Position dans la file';
/** Part du score qui vient de la place dans la file. */
export const LIBELLE_FILE_SCORE = 'File FIFO';
export const PAS_CLASSE = 'Pas dans le ranking actuel';

/** « #1 », « #2 ». */
export function rangLisible(rang: number): string {
  return `#${rang}`;
}
