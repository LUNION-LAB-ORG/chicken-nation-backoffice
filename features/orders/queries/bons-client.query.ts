import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { couponAPI } from "../apis/coupon.api";

/**
 * Racine à part, hors de « order » : chaque événement socket de commande
 * relance toutes les requêtes « order » actives, et cette route est limitée
 * en nombre d'appels par agent.
 */
export const couponKeyQuery = (...params: unknown[]) => ["coupon-commande", ...params];

/** Bons actifs du client sélectionné (code masqué). */
export const useBonsClientQuery = (customerId?: string) =>
    useQuery({
        queryKey: couponKeyQuery("bons-client", customerId),
        queryFn: () => couponAPI.bonsClient(customerId as string),
        enabled: !!customerId,
        staleTime: 60_000,
        retry: false,
    });

/** À appeler après une commande : le solde du bon utilisé a changé. */
export const useInvalidateBonsClient = () => {
    const queryClient = useQueryClient();
    return useCallback(
        () => queryClient.invalidateQueries({ queryKey: couponKeyQuery("bons-client"), exact: false }),
        [queryClient],
    );
};
