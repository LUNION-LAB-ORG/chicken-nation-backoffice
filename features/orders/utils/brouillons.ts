/**
 * Qui voit les paniers non payés de l'application (« brouillons »).
 *
 * Doit rester identique à son jumeau de l'autre côté :
 * backend/src/modules/order/helpers/brouillons.rules.ts (ROLES_BROUILLONS).
 *
 * Sert au filtre « En attente » de la liste des commandes et à toute la
 * relance (onglet, compteur, badge, son). Un autre rôle ne rend ni ne
 * requête rien de tout cela : le serveur refuserait de toute façon.
 */
export const ROLES_BROUILLONS = ["ADMIN", "CALL_CENTER"] as const;

export function peutVoirLesBrouillons(user?: { role?: string | null } | null): boolean {
  return !!user?.role && (ROLES_BROUILLONS as readonly string[]).includes(String(user.role));
}
