import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { incidentAPI } from "../apis/incident.api";
import type { FiltresHistorique, FiltresIncidents, IncidentOuvert } from "../types/incident.types";

/** Clés des incidents : une racine à elles, relue d'un bloc par le temps réel. */
export const incidentKeys = {
  tout: ["incidents"] as const,
  reglages: ["incidents", "reglages"] as const,
  compteurs: (restaurantId?: string) => ["incidents", "compteurs", restaurantId ?? null] as const,
  tableau: (filtres: FiltresIncidents) => ["incidents", "tableau", filtres] as const,
  liste: (filtres: FiltresHistorique) => ["incidents", "liste", filtres] as const,
  statistiques: (q: { du?: string; au?: string; restaurantId?: string }) => ["incidents", "statistiques", q] as const,
  agents: ["incidents", "agents"] as const,
  commandes: (recherche: string) => ["incidents", "commandes", recherche] as const,
  commande: (orderId: string) => ["incidents", "commande", orderId] as const,
  ouverts: (restaurantId?: string) => ["incidents", "ouverts", restaurantId ?? null] as const,
  fiche: (id: string) => ["incidents", "fiche", id] as const,
};

const UNE_MINUTE = 60_000;

/** Catégories et barème : changent rarement. */
export const useReglagesIncidentsQuery = (actif = true) =>
  useQuery({
    queryKey: incidentKeys.reglages,
    queryFn: () => incidentAPI.reglages(),
    enabled: actif,
    staleTime: 5 * UNE_MINUTE,
  });

export const useCompteursIncidentsQuery = (restaurantId?: string, actif = true) =>
  useQuery({
    queryKey: incidentKeys.compteurs(restaurantId),
    queryFn: () => incidentAPI.compteurs(restaurantId),
    enabled: actif,
    refetchInterval: UNE_MINUTE,
    refetchOnWindowFocus: true,
  });

export const useTableauIncidentsQuery = (filtres: FiltresIncidents, actif = true) =>
  useQuery({
    queryKey: incidentKeys.tableau(filtres),
    queryFn: () => incidentAPI.tableau(filtres),
    enabled: actif,
    placeholderData: keepPreviousData,
    refetchInterval: UNE_MINUTE,
    refetchOnWindowFocus: true,
  });

export const useListeIncidentsQuery = (filtres: FiltresHistorique, actif = true) =>
  useQuery({
    queryKey: incidentKeys.liste(filtres),
    queryFn: () => incidentAPI.liste(filtres),
    enabled: actif,
    placeholderData: keepPreviousData,
  });

export const useStatistiquesIncidentsQuery = (q: { du?: string; au?: string; restaurantId?: string }, actif = true) =>
  useQuery({
    queryKey: incidentKeys.statistiques(q),
    queryFn: () => incidentAPI.statistiques(q),
    enabled: actif,
    placeholderData: keepPreviousData,
    staleTime: UNE_MINUTE,
  });

export const useAgentsIncidentsQuery = (actif: boolean) =>
  useQuery({
    queryKey: incidentKeys.agents,
    queryFn: () => incidentAPI.agents(),
    enabled: actif,
    staleTime: 5 * UNE_MINUTE,
  });

/** Commandes proposées par la recherche de « Signaler un incident ». */
export const useRechercheCommandesQuery = (recherche: string) =>
  useQuery({
    queryKey: incidentKeys.commandes(recherche),
    queryFn: () => incidentAPI.chercherCommandes(recherche),
    enabled: recherche.trim().length >= 2,
    staleTime: 30_000,
  });

/** Incidents d'une commande (tiroir, ticket, fenêtre de signalement). */
export const useIncidentsCommandeQuery = (orderId: string | null | undefined, actif = true) =>
  useQuery({
    queryKey: incidentKeys.commande(orderId ?? ""),
    queryFn: () => incidentAPI.parCommande(orderId as string),
    enabled: actif && !!orderId,
    staleTime: 30_000,
    // Commande d'un autre restaurant ou disparue : inutile d'insister.
    retry: (n, e) => ![403, 404].includes((e as { status?: number })?.status ?? 0) && n < 2,
  });

/** Incidents non clôturés rangés par commande : le premier (le plus récent) de chaque commande. */
const parCommande = (ouverts: IncidentOuvert[]): Map<string, IncidentOuvert> => {
  const carte = new Map<string, IncidentOuvert>();
  for (const i of ouverts) if (!carte.has(i.order_id)) carte.set(i.order_id, i);
  return carte;
};

/**
 * Étiquettes des listes de commandes : UNE lecture pour toutes les cartes
 * (même clé), relue par le temps réel des incidents et toutes les minutes.
 */
export const useIncidentsOuvertsQuery = (actif = true) =>
  useQuery({
    queryKey: incidentKeys.ouverts(),
    queryFn: () => incidentAPI.ouverts(),
    enabled: actif,
    select: parCommande,
    staleTime: 30_000,
    refetchInterval: UNE_MINUTE,
  });

export const useFicheIncidentQuery = (id: string | null) =>
  useQuery({
    queryKey: incidentKeys.fiche(id ?? ""),
    queryFn: () => incidentAPI.fiche(id as string),
    enabled: !!id,
    refetchInterval: UNE_MINUTE,
    refetchOnWindowFocus: true,
    retry: (n, e) => ![403, 404].includes((e as { status?: number })?.status ?? 0) && n < 2,
  });

/** Fonction stable : le temps réel s'y abonne sans se réabonner à chaque rendu. */
export const useInvaliderIncidents = () => {
  const queryClient = useQueryClient();
  return useCallback(
    () => queryClient.invalidateQueries({ queryKey: incidentKeys.tout, exact: false }),
    [queryClient],
  );
};
