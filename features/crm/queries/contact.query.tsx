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

export const useContactFicheQuery = (id: string | null) =>
  useQuery({
    queryKey: crmKeyQuery("fiche", id),
    queryFn: () => contactAPI.obtenirParId(id!),
    enabled: !!id,
  });

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
