import { useQuery } from "@tanstack/react-query";
import { habitudesAPI } from "../apis/habitudes.api";

/**
 * Racine à part, hors de « order » : chaque événement socket de commande
 * relance toutes les requêtes « order » actives, et les habitudes d'un client
 * ne changent pas pendant qu'on prend sa commande.
 */
export const habitudesKeyQuery = (...params: unknown[]) => ["habitudes-client", ...params];

/** Plats habituels et dernière commande du client choisi. */
export const useHabitudesClientQuery = (customerId?: string) =>
  useQuery({
    queryKey: habitudesKeyQuery(customerId),
    queryFn: () => habitudesAPI.duClient(customerId as string),
    enabled: !!customerId,
    staleTime: 60_000,
    retry: false,
  });
