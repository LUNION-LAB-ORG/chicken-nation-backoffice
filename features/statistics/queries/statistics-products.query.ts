import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getTopProducts,
  getTopCategories,
  getProductsComparison,
  getProductsByRestaurant,
  getProductsByZone,
  getSalesTrend,
  getChannelBreakdown,
  getPromotionPerformance,
} from '../apis/statistics-products.api';
import {
  ProductsStatsQueryParams,
  ProductsComparisonQueryParams,
} from '../types/products-stats.types';

// ---- Query Key Factory ----
export const statsProductsKeys = {
  all: () => ['stats', 'products'] as const,
  top: (params?: ProductsStatsQueryParams) => ['stats', 'products', 'top', params] as const,
  topCategories: (params?: ProductsStatsQueryParams) => ['stats', 'products', 'top-categories', params] as const,
  comparison: (params?: ProductsComparisonQueryParams) => ['stats', 'products', 'comparison', params] as const,
  byRestaurant: (params?: ProductsStatsQueryParams) => ['stats', 'products', 'by-restaurant', params] as const,
  byZone: (params?: ProductsStatsQueryParams) => ['stats', 'products', 'by-zone', params] as const,
  salesTrend: (params?: ProductsStatsQueryParams) => ['stats', 'products', 'sales-trend', params] as const,
  channelBreakdown: (params?: ProductsStatsQueryParams) => ['stats', 'products', 'channel-breakdown', params] as const,
  promotionPerformance: (params?: ProductsStatsQueryParams) => ['stats', 'products', 'promotion-performance', params] as const,
};

// ---- Hooks ----

export const useTopProductsQuery = (params: ProductsStatsQueryParams = {}, enabled = true) =>
  useQuery({
    queryKey: statsProductsKeys.top(params),
    queryFn: () => getTopProducts(params),
    enabled,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 2,
  });

export const useTopCategoriesQuery = (params: ProductsStatsQueryParams = {}, enabled = true) =>
  useQuery({
    queryKey: statsProductsKeys.topCategories(params),
    queryFn: () => getTopCategories(params),
    enabled,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 2,
  });

export const useProductsComparisonQuery = (
  params: ProductsComparisonQueryParams,
  enabled = true,
) =>
  useQuery({
    queryKey: statsProductsKeys.comparison(params),
    queryFn: () => getProductsComparison(params),
    enabled,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 2,
  });

export const useProductsByRestaurantQuery = (
  params: ProductsStatsQueryParams = {},
  enabled = true,
) =>
  useQuery({
    queryKey: statsProductsKeys.byRestaurant(params),
    queryFn: () => getProductsByRestaurant(params),
    enabled,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 2,
  });

export const useProductsByZoneQuery = (params: ProductsStatsQueryParams = {}, enabled = true) =>
  useQuery({
    queryKey: statsProductsKeys.byZone(params),
    queryFn: () => getProductsByZone(params),
    enabled,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 2,
  });

export const useSalesTrendQuery = (params: ProductsStatsQueryParams = {}, enabled = true) =>
  useQuery({
    queryKey: statsProductsKeys.salesTrend(params),
    queryFn: () => getSalesTrend(params),
    enabled,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 2,
  });

export const useChannelBreakdownQuery = (params: ProductsStatsQueryParams = {}, enabled = true) =>
  useQuery({
    queryKey: statsProductsKeys.channelBreakdown(params),
    queryFn: () => getChannelBreakdown(params),
    enabled,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 2,
  });

export const usePromotionPerformanceQuery = (params: ProductsStatsQueryParams = {}, enabled = true) =>
  useQuery({
    queryKey: statsProductsKeys.promotionPerformance(params),
    queryFn: () => getPromotionPerformance(params),
    enabled,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 2,
  });

// ---- Invalidation ----
export const useInvalidateStatsProducts = () => {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: statsProductsKeys.all(), exact: false });
};
