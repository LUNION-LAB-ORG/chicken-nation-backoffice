import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { prospectAPI } from "../apis/prospect.api";
import { IProspectFiltres } from "../types/prospect.type";
import { conversionKeyQuery } from "./index.query";

export const useProspectsQuery = (filtres: IProspectFiltres, actif = true) =>
  useQuery({
    queryKey: conversionKeyQuery("prospects", filtres),
    queryFn: () => prospectAPI.obtenirTous(filtres),
    placeholderData: keepPreviousData,
    staleTime: 20_000,
    enabled: actif,
  });

export const useProspectFicheQuery = (id: string | null) =>
  useQuery({
    queryKey: conversionKeyQuery("fiche", id),
    queryFn: () => prospectAPI.obtenirParId(id!),
    enabled: !!id,
  });

export const useMaFileQuery = (actif = true) =>
  useQuery({
    queryKey: conversionKeyQuery("ma-file"),
    queryFn: () => prospectAPI.maFile(),
    staleTime: 15_000,
    refetchInterval: 60_000,
    enabled: actif,
  });

export const useAgentsQuery = () =>
  useQuery({
    queryKey: conversionKeyQuery("agents"),
    queryFn: () => prospectAPI.agents(),
    staleTime: 60_000,
  });

export const useExportsQuery = (page: number, actif: boolean) =>
  useQuery({
    queryKey: conversionKeyQuery("exports", page),
    queryFn: () => prospectAPI.exports(page),
    enabled: actif,
  });
