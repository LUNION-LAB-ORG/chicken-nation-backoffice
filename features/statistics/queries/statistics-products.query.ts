import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getTopProducts,
  getTopCategories,
  getProductsComparison,
  getProductsByRestaurant,
  getProductsByZone,
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

// ---- Invalidation ----
export const useInvalidateStatsProducts = () => {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: statsProductsKeys.all(), exact: false });
};
