import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getClientsOverview,
  getClientsAcquisition,
  getClientsRetention,
  getTopClients,
  getInactiveClients,
  getClientsByZone,
  getClientAnalyticsProfile,
} from '../apis/statistics-clients.api';
import {
  ClientsStatsQueryParams,
  InactiveClientsQueryParams,
} from '../types/clients-stats.types';

// ---- Query Key Factory ----
export const statsClientsKeys = {
  all: () => ['stats', 'clients'] as const,
  overview: (params?: ClientsStatsQueryParams) => ['stats', 'clients', 'overview', params] as const,
  acquisition: (params?: ClientsStatsQueryParams) => ['stats', 'clients', 'acquisition', params] as const,
  retention: (restaurantId?: string) => ['stats', 'clients', 'retention', restaurantId] as const,
  top: (params?: ClientsStatsQueryParams) => ['stats', 'clients', 'top', params] as const,
  inactive: (params?: InactiveClientsQueryParams) => ['stats', 'clients', 'inactive', params] as const,
  byZone: (params?: ClientsStatsQueryParams) => ['stats', 'clients', 'by-zone', params] as const,
  profile: (clientId: string) => ['stats', 'clients', 'profile', clientId] as const,
};

// ---- Hooks ----

export const useClientsOverviewQuery = (params: ClientsStatsQueryParams = {}, enabled = true) =>
  useQuery({
    queryKey: statsClientsKeys.overview(params),
    queryFn: () => getClientsOverview(params),
    enabled,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 2,
  });

export const useClientsAcquisitionQuery = (params: ClientsStatsQueryParams = {}, enabled = true) =>
  useQuery({
    queryKey: statsClientsKeys.acquisition(params),
    queryFn: () => getClientsAcquisition(params),
    enabled,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 2,
  });

export const useClientsRetentionQuery = (restaurantId?: string, enabled = true) =>
  useQuery({
    queryKey: statsClientsKeys.retention(restaurantId),
    queryFn: () => getClientsRetention({ restaurantId }),
    enabled,
    staleTime: 10 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    retry: 2,
  });

export const useTopClientsQuery = (params: ClientsStatsQueryParams = {}, enabled = true) =>
  useQuery({
    queryKey: statsClientsKeys.top(params),
    queryFn: () => getTopClients(params),
    enabled,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 2,
  });

export const useInactiveClientsQuery = (params: InactiveClientsQueryParams = {}, enabled = true) =>
  useQuery({
    queryKey: statsClientsKeys.inactive(params),
    queryFn: () => getInactiveClients(params),
    enabled,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 2,
  });

export const useClientsByZoneQuery = (params: ClientsStatsQueryParams = {}, enabled = true) =>
  useQuery({
    queryKey: statsClientsKeys.byZone(params),
    queryFn: () => getClientsByZone(params),
    enabled,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 2,
  });

export const useClientAnalyticsProfileQuery = (clientId: string, enabled = true) =>
  useQuery({
    queryKey: statsClientsKeys.profile(clientId),
    queryFn: () => getClientAnalyticsProfile(clientId),
    enabled: !!clientId && enabled,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 2,
  });

// ---- Invalidation ----
export const useInvalidateStatsClients = () => {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: statsClientsKeys.all(), exact: false });
};
