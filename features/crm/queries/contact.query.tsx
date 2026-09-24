import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { contactAPI } from "../apis/contact.api";
import { IContactFiltres } from "../types/contact.type";
import { crmKeyQuery } from "./index.query";

export const useContactsQuery = (filtres: IContactFiltres, actif = true) =>
  useQuery({
    queryKey: crmKeyQuery("contacts", filtres),
    queryFn: () => contactAPI.obtenirTous(filtres),
    placeholderData: keepPreviousData,
    staleTime: 20_000,
    enabled: actif,
  });

export const useContactFicheQuery = (id: string | null, telephone?: string) =>
  useQuery({
    queryKey: crmKeyQuery("fiche", id, telephone ?? null),
    queryFn: () => contactAPI.obtenirParId(id!, telephone),
    enabled: !!id,
  });

/**
 * Client qui appelle : recherche par numéro complet. `valide` : saisie jugée
 * complète (10 chiffres, ou Entrée pour un numéro étranger plus court).
 */
export const useRechercheNumeroQuery = (telephone: string, valide: boolean) => {
  const chiffres = telephone.replace(/\D/g, "");
  return useQuery({
    queryKey: crmKeyQuery("recherche", chiffres),
    queryFn: () => contactAPI.rechercher(chiffres),
    enabled: valide && chiffres.length >= 8,
    staleTime: 10_000,
  });
};

export const useMaFileQuery = (actif = true) =>
  useQuery({
    queryKey: crmKeyQuery("ma-file"),
    queryFn: () => contactAPI.maFile(),
    staleTime: 15_000,
    refetchInterval: 60_000,
    enabled: actif,
  });

export const useAgentsQuery = () =>
  useQuery({
    queryKey: crmKeyQuery("agents"),
    queryFn: () => contactAPI.agents(),
    staleTime: 60_000,
  });

export const useExportsQuery = (page: number, actif: boolean) =>
  useQuery({
    queryKey: crmKeyQuery("exports", page),
    queryFn: () => contactAPI.exports(page),
    enabled: actif,
  });
