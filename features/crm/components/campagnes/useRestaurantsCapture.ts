import { useMemo } from "react";
import { useRestaurantListQuery } from "../../../restaurants/queries/restaurant-list.query";

export interface RestaurantCapture {
  id: string;
  name: string;
}

/** Restaurants de capture (même liste que le filtre de l'onglet Ventes) et leurs noms par identifiant. */
export function useRestaurantsCapture() {
  const requete = useRestaurantListQuery({ limit: 100 });
  const restaurants = useMemo(
    () => ((requete.data?.data ?? []) as unknown as RestaurantCapture[]).filter((r) => r?.id),
    [requete.data],
  );
  const noms = useMemo(() => new Map(restaurants.map((r) => [r.id, r.name ?? ""])), [restaurants]);
  return { requete, restaurants, noms };
}
