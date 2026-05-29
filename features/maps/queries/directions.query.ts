import { useQuery } from "@tanstack/react-query";

import { getRoute, type IGetRouteParams } from "../services/directions.service";

/** Arrondi 5 décimales (~1 m) → clé de cache stable malgré le bruit GPS. */
function roundKey(n: number): number {
  return Math.round(n * 1e5) / 1e5;
}

/**
 * Itinéraire routier (Google Directions via le backend) entre 2 points.
 *
 * `params === null` → requête désactivée (pas encore de coords). Le cache
 * `staleTime` 10 min est aligné sur le cache backend : rouvrir un même détail
 * de course ne retape pas l'API. La clé arrondit les coords pour ne pas
 * invalider le cache à chaque micro-variation GPS de la destination.
 */
export const useDirectionsQuery = (params: IGetRouteParams | null) =>
  useQuery({
    queryKey: [
      "maps",
      "directions",
      params && {
        o: [roundKey(params.origin.lat), roundKey(params.origin.lng)],
        d: [roundKey(params.destination.lat), roundKey(params.destination.lng)],
        w: params.waypoints?.map((w) => [roundKey(w.lat), roundKey(w.lng)]) ?? null,
      },
    ],
    queryFn: () => getRoute(params!),
    enabled: params !== null,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: 1,
  });
