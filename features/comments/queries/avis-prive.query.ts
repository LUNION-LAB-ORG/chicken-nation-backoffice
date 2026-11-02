import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { avisPriveAPI } from "../apis/avis-prive.api";
import type { RequeteAvis } from "../types/avis-prive.types";

/**
 * Clés des retours privés. Racine propre : les notes après commande
 * (`comments`) gardent leur cache à elles.
 */
export const avisKeys = {
  tout: ["avis-prives"] as const,
  liste: (requete: RequeteAvis) => ["avis-prives", "liste", requete] as const,
  compteurs: (restaurantId?: string) => ["avis-prives", "compteurs", restaurantId ?? null] as const,
  fiche: (id: string) => ["avis-prives", "fiche", id] as const,
  agents: ["avis-prives", "agents"] as const,
};

/** Rafraîchissement des listes, comme les autres écrans de suivi. */
const UNE_MINUTE = 60_000;

export const useListeAvisQuery = (requete: RequeteAvis, actif = true) =>
  useQuery({
    queryKey: avisKeys.liste(requete),
    queryFn: () => avisPriveAPI.liste(requete),
    enabled: actif,
    placeholderData: keepPreviousData,
    refetchInterval: UNE_MINUTE,
    refetchOnWindowFocus: true,
  });

/** Compteurs du haut de la liste et pastille de l'onglet. */
export const useCompteursAvisQuery = (restaurantId?: string, actif = true) =>
  useQuery({
    queryKey: avisKeys.compteurs(restaurantId),
    queryFn: () => avisPriveAPI.compteurs(restaurantId),
    enabled: actif,
    refetchInterval: UNE_MINUTE,
    refetchOnWindowFocus: true,
  });

export const useFicheAvisQuery = (id: string | null) =>
  useQuery({
    queryKey: avisKeys.fiche(id ?? ""),
    queryFn: () => avisPriveAPI.fiche(id as string),
    enabled: !!id,
    refetchInterval: UNE_MINUTE,
    refetchOnWindowFocus: true,
    // Un avis supprimé répond 404 : inutile d'insister.
    retry: (n, e) => (e as { status?: number })?.status !== 404 && n < 2,
  });

/** Agents qui traitent les avis (administrateur et call center). */
export const useAgentsAvisQuery = (actif: boolean) =>
  useQuery({
    queryKey: avisKeys.agents,
    queryFn: () => avisPriveAPI.agents(),
    enabled: actif,
    staleTime: 5 * UNE_MINUTE,
  });

/** Fonction stable : le temps réel s'y abonne sans se réabonner à chaque rendu. */
export const useInvaliderAvis = () => {
  const queryClient = useQueryClient();
  return useCallback(
    () => queryClient.invalidateQueries({ queryKey: avisKeys.tout, exact: false }),
    [queryClient],
  );
};
