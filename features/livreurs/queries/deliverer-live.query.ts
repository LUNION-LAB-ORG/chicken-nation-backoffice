import { useQuery } from "@tanstack/react-query";

import {
  getDelivererLiveLocations,
  type IGetLiveLocationsParams,
} from "../services/deliverer-live.service";

/**
 * Hook live des positions GPS livreur pour le dashboard admin (P6c).
 *
 * Refetch automatique toutes les 15 secondes pour suivre les déplacements.
 * Plus court serait pertinent avec WebSocket — pour l'instant polling simple
 * qui reste léger (endpoint rapide, pas de join lourd).
 */
export const useDelivererLiveLocationsQuery = (
  params: IGetLiveLocationsParams = {},
  // Vue Livreurs « Aujourd'hui » : relue toutes les 60 s.
  options: { refetchInterval?: number; enabled?: boolean } = {},
) =>
  useQuery({
    queryKey: ["deliverers", "live-locations", params],
    queryFn: () => getDelivererLiveLocations(params),
    enabled: options.enabled ?? true,
    refetchInterval: options.refetchInterval ?? 15 * 1000,
    refetchIntervalInBackground: false,
    staleTime: 10 * 1000,
  });
