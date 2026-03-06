import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getDeliveryOverview,
  getDeliveryFeesBreakdown,
  getDeliveryByZone,
  getDeliveryPerformance,
} from '../apis/statistics-delivery.api';
import { DeliveryStatsQueryParams } from '../types/delivery-stats.types';

// ---- Query Key Factory ----
export const statsDeliveryKeys = {
  all: () => ['stats', 'delivery'] as const,
  overview: (params?: DeliveryStatsQueryParams) => ['stats', 'delivery', 'overview', params] as const,
  feesBreakdown: (params?: DeliveryStatsQueryParams) => ['stats', 'delivery', 'fees-breakdown', params] as const,
  byZone: (params?: DeliveryStatsQueryParams) => ['stats', 'delivery', 'by-zone', params] as const,
  performance: (params?: DeliveryStatsQueryParams) => ['stats', 'delivery', 'performance', params] as const,
};

// ---- Hooks ----

export const useDeliveryOverviewQuery = (params: DeliveryStatsQueryParams = {}, enabled = true) =>
  useQuery({
    queryKey: statsDeliveryKeys.overview(params),
    queryFn: () => getDeliveryOverview(params),
    enabled,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 2,
  });

export const useDeliveryFeesBreakdownQuery = (
  params: DeliveryStatsQueryParams = {},
  enabled = true,
) =>
  useQuery({
    queryKey: statsDeliveryKeys.feesBreakdown(params),
    queryFn: () => getDeliveryFeesBreakdown(params),
    enabled,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 2,
  });

export const useDeliveryByZoneQuery = (params: DeliveryStatsQueryParams = {}, enabled = true) =>
  useQuery({
    queryKey: statsDeliveryKeys.byZone(params),
    queryFn: () => getDeliveryByZone(params),
    enabled,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 2,
  });

export const useDeliveryPerformanceQuery = (
  params: DeliveryStatsQueryParams = {},
  enabled = true,
) =>
  useQuery({
    queryKey: statsDeliveryKeys.performance(params),
    queryFn: () => getDeliveryPerformance(params),
    enabled,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 2,
  });

// ---- Invalidation ----
export const useInvalidateStatsDelivery = () => {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: statsDeliveryKeys.all(), exact: false });
};
