import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { analyseAPI } from "../apis/analyse.api";
import { ICohortesFiltres, IPeriode, IVentesFiltres, IVerbatimsFiltres } from "../types/analyse.type";
import { crmKeyQuery } from "./index.query";

const options = { staleTime: 60_000, placeholderData: keepPreviousData };

export const useComparatifPublicsQuery = (p: IPeriode, actif = true) =>
  useQuery({
    queryKey: crmKeyQuery("analyse", "publics", p),
    queryFn: () => analyseAPI.publics(p),
    enabled: actif,
    ...options,
  });

export const useVueEnsembleQuery = (p: IPeriode) =>
  useQuery({ queryKey: crmKeyQuery("analyse", "vue", p), queryFn: () => analyseAPI.vueEnsemble(p), ...options });

export const useParetoQuery = (p: IPeriode) =>
  useQuery({ queryKey: crmKeyQuery("analyse", "raisons", p), queryFn: () => analyseAPI.raisons(p), ...options });

export const useCohortesQuery = (p: ICohortesFiltres) =>
  useQuery({ queryKey: crmKeyQuery("analyse", "cohortes", p), queryFn: () => analyseAPI.cohortes(p), ...options });

export const useCouponsStatsQuery = (p: IPeriode) =>
  useQuery({ queryKey: crmKeyQuery("analyse", "coupons", p), queryFn: () => analyseAPI.coupons(p), ...options });

export const useQualiteQuery = (p: IPeriode) =>
  useQuery({ queryKey: crmKeyQuery("analyse", "qualite", p), queryFn: () => analyseAPI.qualite(p), ...options });

export const useAgentsPerfQuery = (p: IPeriode) =>
  useQuery({ queryKey: crmKeyQuery("analyse", "agents", p), queryFn: () => analyseAPI.agents(p), ...options });

export const useTendanceQuery = (p: IPeriode) =>
  useQuery({ queryKey: crmKeyQuery("analyse", "tendance", p), queryFn: () => analyseAPI.tendance(p), ...options });

export const useVerbatimsQuery = (p: IVerbatimsFiltres) =>
  useQuery({ queryKey: crmKeyQuery("analyse", "verbatims", p), queryFn: () => analyseAPI.verbatims(p), ...options });

export const useVentesQuery = (p: IVentesFiltres) =>
  useQuery({ queryKey: crmKeyQuery("analyse", "ventes", p), queryFn: () => analyseAPI.ventes(p), ...options });
