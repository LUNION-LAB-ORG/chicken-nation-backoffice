import { useQuery } from "@tanstack/react-query";

import { getDelivererScoringInfo } from "../services/deliverer-scoring.service";

/**
 * Hook React Query pour la vue scoring d'un livreur.
 *
 * Polling 15s : suffisant pour suivre les changements de rang / refus / pause
 * sans pression DB. Pour des changements critiques (auto-pause), un event WS
 * dédié peut compléter ce polling à l'avenir.
 */
export const useDelivererScoringInfoQuery = (delivererId: string | null | undefined) =>
  useQuery({
    queryKey: ["deliverers", "scoring-info", delivererId],
    queryFn: () => getDelivererScoringInfo(delivererId as string),
    enabled: Boolean(delivererId),
    refetchInterval: 15 * 1000,
    refetchIntervalInBackground: false,
    staleTime: 10 * 1000,
  });
