/**
 * QUI CONFIRME LA RÉCUPÉRATION D'UNE COURSE (écran Commandes).
 *
 * Depuis le 24/10 au soir, la caissière ne saisit plus le code de retrait :
 * le livreur le lui dit, elle touche le groupe de la course (ou la commande
 * seule) et confirme. La course est lue et remise par son identifiant
 * (`GET /courses/operations/:id`, `POST /courses/operations/:id/recuperation`) :
 * le restaurant est celui de la course, plus besoin de le deviner. Tant que le
 * serveur n'a pas ces routes, l'écran se replie sur les routes à code avec le
 * code et le restaurant de la course déjà à l'écran (`operations-service.ts`).
 *
 * Le code de retrait (3 chiffres) n'est unique que dans UN restaurant et pour
 * UNE journée de service (incident du 22/10).
 */

/**
 * Rôles d'un point de vente, les mêmes que le serveur (`STORE_ROLES`,
 * backend `users/helpers/staff-type.helper.ts`).
 */
const ROLES_DE_RESTAURANT = ['MANAGER', 'ASSISTANT_MANAGER', 'CAISSIER', 'CUISINE'];

/**
 * Rôles admis par le serveur sur `courses/operations` (backend
 * `course-operations.controller.ts`). Les autres (centre d'appels, cuisine,
 * suivi des livraisons, marketing…) recevraient 403 : le bouton leur est caché.
 */
const ROLES_REMISE_AU_LIVREUR = ['ADMIN', 'MANAGER', 'ASSISTANT_MANAGER', 'CAISSIER'];

interface Membre {
  type?: string | null;
  role?: string | null;
  restaurant_id?: string | null;
}

/**
 * Compte de restaurant, avec la règle du serveur (`estCompteDeRestaurant`,
 * backend `users/helpers/personnel-scope.helper.ts`) : type RESTAURANT ou
 * rôle d'un point de vente. Un compte du siège qui garde un restaurant dans
 * sa fiche n'en est pas un : le serveur suit pour lui le restaurant choisi.
 */
export function estCompteDeRestaurant(membre: Membre | null | undefined): boolean {
  if (!membre) return false;
  return membre.type === 'RESTAURANT' || ROLES_DE_RESTAURANT.includes(membre.role ?? '');
}

/** Vrai si le membre peut confirmer la récupération d'une course (bouton du groupe et du tiroir). */
export function peutConfirmerRecuperation(membre: Membre | null | undefined): boolean {
  return ROLES_REMISE_AU_LIVREUR.includes(membre?.role ?? '');
}
