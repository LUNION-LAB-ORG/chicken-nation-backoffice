import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getOrdersOverview,
  getOrdersByChannel,
  getOrdersProcessingTime,
  getLateOrders,
  getRestaurantPunctuality,
  getOrdersByRestaurant,
  getOrdersByRestaurantAndType,
  getOrdersByRestaurantAndSource,
  getOrdersDailyTrend,
  getClientZones,
  getDailyTrendByRestaurant,
  getRestaurantsLocations,
  getInfluenceZones,
} from '../apis/statistics-orders.api';
import { OrdersStatsQueryParams } from '../types/orders-stats.types';

// ---- Query Key Factory ----
export const statsOrdersKeys = {
  all: () => ['stats', 'orders'] as const,
  overview: (params?: OrdersStatsQueryParams) => ['stats', 'orders', 'overview', params] as const,
  byChannel: (params?: OrdersStatsQueryParams) => ['stats', 'orders', 'by-channel', params] as const,
  processingTime: (params?: OrdersStatsQueryParams) => ['stats', 'orders', 'processing-time', params] as const,
  late: (params?: OrdersStatsQueryParams) => ['stats', 'orders', 'late', params] as const,
  restaurantPunctuality: (params?: OrdersStatsQueryParams) => ['stats', 'orders', 'restaurant-punctuality', params] as const,
  byRestaurant: (params?: OrdersStatsQueryParams) => ['stats', 'orders', 'by-restaurant', params] as const,
  byRestaurantAndType: (params?: OrdersStatsQueryParams) => ['stats', 'orders', 'by-restaurant-and-type', params] as const,
  byRestaurantAndSource: (params?: OrdersStatsQueryParams) => ['stats', 'orders', 'by-restaurant-and-source', params] as const,
  dailyTrend: (params?: OrdersStatsQueryParams) => ['stats', 'orders', 'daily-trend', params] as const,
  clientZones: (params?: OrdersStatsQueryParams) => ['stats', 'orders', 'client-zones', params] as const,
  dailyTrendByRestaurant: (params?: OrdersStatsQueryParams) => ['stats', 'orders', 'daily-trend-by-restaurant', params] as const,
  restaurantsLocations: () => ['stats', 'orders', 'restaurants-locations'] as const,
  influenceZones: (params?: OrdersStatsQueryParams) => ['stats', 'orders', 'influence-zones', params] as const,
};

// ---- Hooks ----

export const useOrdersOverviewQuery = (params: OrdersStatsQueryParams = {}, enabled = true) =>
  useQuery({
    queryKey: statsOrdersKeys.overview(params),
    queryFn: () => getOrdersOverview(params),
    enabled,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 2,
  });

export const useOrdersByChannelQuery = (params: OrdersStatsQueryParams = {}, enabled = true) =>
  useQuery({
    queryKey: statsOrdersKeys.byChannel(params),
    queryFn: () => getOrdersByChannel(params),
    enabled,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 2,
  });

export const useOrdersProcessingTimeQuery = (
  params: OrdersStatsQueryParams = {},
  enabled = true,
) =>
  useQuery({
    queryKey: statsOrdersKeys.processingTime(params),
    queryFn: () => getOrdersProcessingTime(params),
    enabled,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 2,
  });

export const useLateOrdersQuery = (params: OrdersStatsQueryParams = {}, enabled = true) =>
  useQuery({
    queryKey: statsOrdersKeys.late(params),
    queryFn: () => getLateOrders(params),
    enabled,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 2,
  });

export const useRestaurantPunctualityQuery = (params: OrdersStatsQueryParams = {}, enabled = true) =>
  useQuery({
    queryKey: statsOrdersKeys.restaurantPunctuality(params),
    queryFn: () => getRestaurantPunctuality(params),
    enabled,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 2,
  });

export const useOrdersByRestaurantQuery = (params: OrdersStatsQueryParams = {}, enabled = true) =>
  useQuery({
    queryKey: statsOrdersKeys.byRestaurant(params),
    queryFn: () => getOrdersByRestaurant(params),
    enabled,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 2,
  });

export const useOrdersByRestaurantAndTypeQuery = (params: OrdersStatsQueryParams = {}, enabled = true) =>
  useQuery({
    queryKey: statsOrdersKeys.byRestaurantAndType(params),
    queryFn: () => getOrdersByRestaurantAndType(params),
    enabled,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 2,
  });

export const useOrdersByRestaurantAndSourceQuery = (params: OrdersStatsQueryParams = {}, enabled = true) =>
  useQuery({
    queryKey: statsOrdersKeys.byRestaurantAndSource(params),
    queryFn: () => getOrdersByRestaurantAndSource(params),
    enabled,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 2,
  });

export const useOrdersDailyTrendQuery = (params: OrdersStatsQueryParams = {}, enabled = true) =>
  useQuery({
    queryKey: statsOrdersKeys.dailyTrend(params),
    queryFn: () => getOrdersDailyTrend(params),
    enabled,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 2,
  });

export const useClientZonesQuery = (params: OrdersStatsQueryParams = {}, enabled = true) =>
  useQuery({
    queryKey: statsOrdersKeys.clientZones(params),
    queryFn: () => getClientZones(params),
    enabled,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 2,
  });

export const useDailyTrendByRestaurantQuery = (params: OrdersStatsQueryParams = {}, enabled = true) =>
  useQuery({
    queryKey: statsOrdersKeys.dailyTrendByRestaurant(params),
    queryFn: () => getDailyTrendByRestaurant(params),
    enabled,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 2,
  });

export const useRestaurantsLocationsQuery = (enabled = true) =>
  useQuery({
    queryKey: statsOrdersKeys.restaurantsLocations(),
    queryFn: () => getRestaurantsLocations(),
    enabled,
    staleTime: 10 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    retry: 2,
  });

export const useInfluenceZonesQuery = (params: OrdersStatsQueryParams = {}, enabled = true) =>
  useQuery({
    queryKey: statsOrdersKeys.influenceZones(params),
    queryFn: () => getInfluenceZones(params),
    enabled,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 2,
  });

// ---- Invalidation ----
export const useInvalidateStatsOrders = () => {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: statsOrdersKeys.all(), exact: false });
};
