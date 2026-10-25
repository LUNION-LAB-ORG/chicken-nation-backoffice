/**
 * Bulle d'erreur de la liste des restaurants (relecture du 25/10). Un
 * identifiant fixe : une seule bulle, même si plusieurs écrans lisent la
 * liste ou si l'écran se redessine souvent (Carte live, à chaque position).
 */
export const ID_BULLE_ERREUR_RESTAURANTS = 'restaurants-liste';

export function bulleErreurRestaurants(erreur: unknown): { message: string; options: { id: string } } {
  const message =
    erreur instanceof Error && erreur.message.trim() ? erreur.message : 'Impossible de charger les restaurants';
  return { message, options: { id: ID_BULLE_ERREUR_RESTAURANTS } };
}
