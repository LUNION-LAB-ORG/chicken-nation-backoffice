/**
 * Nom court d'un restaurant, pour les places étroites (cartes, groupes,
 * bandeau, alertes) : « CHICKEN NATION ZONE 4 » devient « ZONE 4 ».
 *
 * Tous les restaurants portent le nom de la marque en tête : sur « Tous »,
 * ce préfixe commun prenait la place du livreur et de son état, coupés
 * (vérification à l'écran du 24/10, 1280 px de large). Le nom entier reste
 * dans les titres et les listes.
 *
 * Nom sans le préfixe, ou réduit au seul préfixe : rendu tel quel.
 */
const PREFIXE_MARQUE = /^\s*chicken\s+nation(?:\s*[-·:,]\s*|\s+)(?=\S)/i;

export function nomCourtRestaurant(nom: string | null | undefined): string | null {
  if (nom === null || nom === undefined) return null;
  const propre = nom.trim();
  if (!propre) return null;
  const court = propre.replace(PREFIXE_MARQUE, "").trim();
  return court || propre;
}
