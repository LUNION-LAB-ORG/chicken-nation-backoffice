import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { analyseAPI } from "../apis/analyse.api";
import { IPeriode } from "../types/analyse.type";
import { conversionKeyQuery } from "./index.query";

const options = { staleTime: 60_000, placeholderData: keepPreviousData };

export const useVueEnsembleQuery = (p: IPeriode) =>
  useQuery({ queryKey: conversionKeyQuery("analyse", "vue", p), queryFn: () => analyseAPI.vueEnsemble(p), ...options });

export const useParetoQuery = (p: IPeriode) =>
  useQuery({ queryKey: conversionKeyQuery("analyse", "raisons", p), queryFn: () => analyseAPI.raisons(p), ...options });

export const useCohortesQuery = () =>
  useQuery({ queryKey: conversionKeyQuery("analyse", "cohortes"), queryFn: analyseAPI.cohortes, staleTime: 5 * 60_000 });

export const useCouponsStatsQuery = (p: IPeriode) =>
  useQuery({ queryKey: conversionKeyQuery("analyse", "coupons", p), queryFn: () => analyseAPI.coupons(p), ...options });

export const useQualiteQuery = (p: IPeriode) =>
  useQuery({ queryKey: conversionKeyQuery("analyse", "qualite", p), queryFn: () => analyseAPI.qualite(p), ...options });

export const useAgentsPerfQuery = (p: IPeriode) =>
  useQuery({ queryKey: conversionKeyQuery("analyse", "agents", p), queryFn: () => analyseAPI.agents(p), ...options });

export const useTendanceQuery = (p: IPeriode) =>
  useQuery({ queryKey: conversionKeyQuery("analyse", "tendance", p), queryFn: () => analyseAPI.tendance(p), ...options });

export const useVerbatimsQuery = (p: IPeriode & { search?: string; page?: number }) =>
  useQuery({ queryKey: conversionKeyQuery("analyse", "verbatims", p), queryFn: () => analyseAPI.verbatims(p), ...options });
