/**
 * RESTAURANT D'UN CODE DE RETRAIT (incident du 22/10).
 *
 * Le code de retrait (3 chiffres) n'est unique que dans UN restaurant et pour
 * UNE journée de service (5 h à 5 h, heure d'Abidjan). Deux restaurants
 * peuvent avoir le même code en même temps : la caissière de l'un tombait sur
 * la course de l'autre (« 1 commande(s) sur 1 ne sont pas encore prête(s) »
 * alors que la sienne l'était).
 *
 * Le serveur cherche donc le code dans un restaurant (contrat du 22/10,
 * backend `course-operations.controller.ts`) :
 *  - compte de restaurant (caissière, manager) : le sien, toujours, et un
 *    autre `restaurant_id` est refusé (403) ;
 *  - compte du siège (ADMIN, centre d'appels) : le `restaurant_id` envoyé, en
 *    paramètre pour l'aperçu, dans le corps pour la validation ;
 *  - aucun : tous les restaurants de la journée, et « Ce code existe dans
 *    plusieurs restaurants : choisissez le restaurant. » (409) s'il y en a
 *    plusieurs.
 *
 * La caisse Sunmi n'envoie que `{ pickup_code }` : elle marche par le seul
 * rattachement de la caissière.
 */

/**
 * Rôles d'un point de vente, les mêmes que le serveur (`STORE_ROLES`,
 * backend `users/helpers/staff-type.helper.ts`).
 */
const ROLES_DE_RESTAURANT = ['MANAGER', 'ASSISTANT_MANAGER', 'CAISSIER', 'CUISINE'];

/**
 * Rôles admis par le serveur sur `courses/operations` (backend
 * `course-operations.controller.ts`). Les autres (centre d'appels, cuisine,
 * livraison, marketing…) recevaient 403 : le champ leur est caché.
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

/** Vrai si le membre peut chercher et valider un code de retrait. */
export function peutValiderCodeRetrait(membre: Membre | null | undefined): boolean {
  return ROLES_REMISE_AU_LIVREUR.includes(membre?.role ?? '');
}

/**
 * Restaurant où chercher un code :
 *  - compte de restaurant : le sien, même si un autre est resté choisi dans
 *    le navigateur (le serveur le refuserait) ;
 *  - compte du siège : celui choisi dans Opérations, même si sa fiche porte
 *    un restaurant (c'est le choix que le serveur suit) ;
 *  - `undefined` sur « Tous les restaurants » : rien n'est envoyé.
 */
export function restaurantPourCodeRetrait(
  membre: Membre | null | undefined,
  restaurantChoisi: string | null | undefined,
): string | undefined {
  if (estCompteDeRestaurant(membre) && membre?.restaurant_id) return membre.restaurant_id;
  return restaurantChoisi || undefined;
}

/**
 * Restaurant envoyé avec la validation : celui de la recherche ; sur « Tous
 * les restaurants », celui de la course affichée par l'aperçu. On valide
 * ainsi EXACTEMENT la course que la caissière a sous les yeux, même si le
 * même code apparaît entre-temps dans un autre restaurant.
 */
export function restaurantPourValidation(
  restaurantRecherche: string | undefined,
  course: { restaurant_id?: string | null },
): string | undefined {
  return restaurantRecherche || course.restaurant_id || undefined;
}
