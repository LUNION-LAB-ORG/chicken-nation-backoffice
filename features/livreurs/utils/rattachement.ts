/**
 * RATTACHEMENT D'UN LIVREUR (demande du 09/11) : valider avec le restaurant,
 * changer de restaurant en un geste. Règles pures testées par `bun test`.
 *
 * Le serveur déplace le livreur d'un planning à l'autre et dit ce qu'il a
 * fait (`plannings`) : le message le répète en une ligne, sans plus.
 */

import { nomCourtRestaurant } from '../../restaurants/utils/nom-court';
import { haversineKm } from './distance';

/** Réponse du serveur : plannings quittés et rejoints. Null : le planning n'a pas répondu. */
export interface PlanningsSuivis {
  retire_de: { plan_id: string; restaurant_id: string; creneaux: number }[];
  ajoute_a: { plan_id: string; restaurant_id: string; creneaux: number }[];
}

export interface RestaurantChoisissable {
  id: string;
  name: string;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

export interface RestaurantClasse<R extends RestaurantChoisissable> {
  restaurant: R;
  /** Distance au domicile du livreur, en km ; null sans domicile ou sans coordonnées. */
  distanceKm: number | null;
}

/**
 * Restaurants du plus proche au plus loin du domicile du livreur ; sans
 * domicile, l'ordre reçu. Un restaurant sans coordonnées passe après.
 */
export function restaurantsParProximite<R extends RestaurantChoisissable>(
  restaurants: readonly R[],
  domicile: { lat: number; lng: number } | null | undefined,
): RestaurantClasse<R>[] {
  const classes = restaurants.map((restaurant) => ({
    restaurant,
    distanceKm:
      domicile && restaurant.latitude != null && restaurant.longitude != null
        ? haversineKm(domicile, { lat: restaurant.latitude, lng: restaurant.longitude })
        : null,
  }));
  if (!domicile) return classes;
  return classes
    .map((c, i) => ({ c, i }))
    .sort(
      (a, b) =>
        (a.c.distanceKm ?? Number.POSITIVE_INFINITY) - (b.c.distanceKm ?? Number.POSITIVE_INFINITY) || a.i - b.i,
    )
    .map(({ c }) => c);
}

/** Choix de départ : son restaurant actuel, sinon le plus proche de chez lui, sinon aucun. */
export function restaurantPropose(
  classes: readonly RestaurantClasse<RestaurantChoisissable>[],
  actuel: string | null | undefined,
): string {
  if (actuel && classes.some((c) => c.restaurant.id === actuel)) return actuel;
  const proche = classes.find((c) => c.distanceKm !== null);
  return proche?.restaurant.id ?? '';
}

/** « à 800 m de chez lui », « à 3,4 km de chez lui » ; null sans distance. */
export function distanceDeChezLui(km: number | null): string | null {
  if (km === null || !Number.isFinite(km)) return null;
  if (km < 1) return `à ${Math.max(100, Math.round((km * 1000) / 100) * 100)} m de chez lui`;
  return `à ${km.toFixed(1).replace('.', ',')} km de chez lui`;
}

/**
 * Message après « Valider » : « Livreur validé et ajouté au planning de
 * ZONE 4 », ou « Livreur validé » quand aucun planning en cours ne l'attend
 * (il sera dans le prochain) ou que le planning n'a pas répondu.
 */
export function messageValidation(
  plannings: PlanningsSuivis | null | undefined,
  restaurant: string | null | undefined,
  debut = 'Livreur validé',
): string {
  const nom = nomCourtRestaurant(restaurant);
  if (plannings && plannings.ajoute_a.length > 0 && nom) return `${debut} et ajouté au planning de ${nom}`;
  return debut;
}

/**
 * Message après un changement de restaurant : « Restaurant changé : retiré
 * du planning de FAYA, ajouté à celui de ZONE 4. » ; sans planning touché,
 * le message d'avant.
 */
export function messageChangement(
  plannings: PlanningsSuivis | null | undefined,
  ancien: string | null | undefined,
  nouveau: string | null | undefined,
): string {
  if (!plannings) return 'Restaurant affecté au livreur';
  const morceaux: string[] = [];
  const nomAncien = nomCourtRestaurant(ancien);
  const nomNouveau = nomCourtRestaurant(nouveau);
  if (plannings.retire_de.length > 0) morceaux.push(nomAncien ? `retiré du planning de ${nomAncien}` : 'retiré de son ancien planning');
  if (plannings.ajoute_a.length > 0) {
    morceaux.push(morceaux.length ? `ajouté à celui de ${nomNouveau ?? 'son restaurant'}` : `ajouté au planning de ${nomNouveau ?? 'son restaurant'}`);
  }
  if (morceaux.length === 0) return 'Restaurant affecté au livreur';
  return `Restaurant changé : ${morceaux.join(', ')}.`;
}
