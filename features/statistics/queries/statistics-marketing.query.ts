import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getPromoUsage,
  getPromotionsPerformance,
  getTopZones,
  getChurnExport,
} from '../apis/statistics-marketing.api';
import {
  MarketingQueryParams,
  ChurnExportQueryParams,
  TopZonesQueryParams,
} from '../types/marketing-stats.types';

// ---- Query Key Factory ----
export const statsMarketingKeys = {
  all: () => ['stats', 'marketing'] as const,
  promoUsage: (params?: MarketingQueryParams) => ['stats', 'marketing', 'promo-usage', params] as const,
  promotionsPerf: (params?: MarketingQueryParams) => ['stats', 'marketing', 'promotions-perf', params] as const,
  topZones: (params?: TopZonesQueryParams) => ['stats', 'marketing', 'top-zones', params] as const,
  churnExport: (params?: ChurnExportQueryParams) => ['stats', 'marketing', 'churn-export', params] as const,
};

// ---- Hooks ----

export const usePromoUsageQuery = (params: MarketingQueryParams = {}, enabled = true) =>
  useQuery({
    queryKey: statsMarketingKeys.promoUsage(params),
    queryFn: () => getPromoUsage(params),
    enabled,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 2,
  });

export const usePromotionsPerformanceQuery = (params: MarketingQueryParams = {}, enabled = true) =>
  useQuery({
    queryKey: statsMarketingKeys.promotionsPerf(params),
    queryFn: () => getPromotionsPerformance(params),
    enabled,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 2,
  });

export const useTopZonesQuery = (params: TopZonesQueryParams = {}, enabled = true) =>
  useQuery({
    queryKey: statsMarketingKeys.topZones(params),
    queryFn: () => getTopZones(params),
    enabled,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 2,
  });

/**
 * La liste des clients churnés (pas de cache agressif car souvent exportée directement).
 */
export const useChurnExportQuery = (params: ChurnExportQueryParams = {}, enabled = true) =>
  useQuery({
    queryKey: statsMarketingKeys.churnExport(params),
    queryFn: () => getChurnExport(params),
    enabled,
    staleTime: 2 * 60 * 1000, // 2min : données fraîches pour export
    gcTime: 5 * 60 * 1000,
    retry: 2,
  });

// ---- Invalidation ----
export const useInvalidateStatsMarketing = () => {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: statsMarketingKeys.all(), exact: false });
};
