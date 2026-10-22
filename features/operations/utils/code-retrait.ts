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
 *  - membre rattaché à un restaurant (caissière, manager) : le sien, toujours,
 *    et un autre `restaurant_id` est refusé (403) ;
 *  - sinon (ADMIN, centre d'appels) : le `restaurant_id` envoyé, en paramètre
 *    pour l'aperçu, dans le corps pour la validation ;
 *  - aucun : tous les restaurants de la journée, et « Ce code existe dans
 *    plusieurs restaurants : choisissez le restaurant. » (409) s'il y en a
 *    plusieurs.
 *
 * La caisse Sunmi n'envoie que `{ pickup_code }` : elle marche par le seul
 * rattachement de la caissière.
 */

interface UtilisateurRattache {
  restaurant_id?: string | null;
}

/**
 * Restaurant où chercher un code : celui du membre s'il est rattaché à un
 * restaurant (même si un autre est resté choisi dans le navigateur : le
 * serveur le refuserait), sinon celui choisi dans Opérations. `undefined` sur
 * « Tous les restaurants » : rien n'est envoyé.
 */
export function restaurantPourCodeRetrait(
  utilisateur: UtilisateurRattache | null | undefined,
  restaurantChoisi: string | null | undefined,
): string | undefined {
  return utilisateur?.restaurant_id || restaurantChoisi || undefined;
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
