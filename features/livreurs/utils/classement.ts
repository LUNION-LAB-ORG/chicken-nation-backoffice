/**
 * CLASSEMENT ET FILE SUR LA FICHE DU LIVREUR (conception du 24/10, 3.3).
 *
 * Deux rangs différents, deux mots différents :
 *  - « Classement » (fiche seulement) : la place par le score, parmi les
 *    livreurs qui peuvent recevoir l'offre, « 3e sur 5 » ;
 *  - « Place dans la file » : l'ordre d'arrivée dans la file, « 2e ».
 * Plus de « #3 », de « File FIFO » ni de « ranking ».
 */

export const LIBELLE_CLASSEMENT = 'Classement';
/** Part du score qui vient de la place dans la file. */
export const LIBELLE_FILE_SCORE = 'File';
export const PAS_CLASSE = 'Pas classé en ce moment';

/** « 1er », « 2e ». */
export function rangLisible(rang: number): string {
  return rang === 1 ? '1er' : `${rang}e`;
}

/** « 3e sur 5 ». */
export function texteClassement(position: number, total: number): string {
  return `${rangLisible(position)} sur ${total}`;
}
