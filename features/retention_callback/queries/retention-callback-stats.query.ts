import { useQuery } from '@tanstack/react-query';
import { retentionStatsAPI, type RetentionStatsDateFilter } from '../apis/retention-callback-stats.api';
import { retentionKeys } from './index.query';

export const useRetentionOverviewQuery = (params?: RetentionStatsDateFilter, enabled = true) =>
  useQuery({
    queryKey: retentionKeys.statsOverview(params),
    queryFn: () => retentionStatsAPI.getOverview(params),
    enabled,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 2,
  });

export const useRetentionByReasonQuery = (params?: RetentionStatsDateFilter, enabled = true) =>
  useQuery({
    queryKey: retentionKeys.statsByReason(params),
    queryFn: () => retentionStatsAPI.getByReason(params),
    enabled,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 2,
  });

export const useRetentionAgentPerformanceQuery = (params?: RetentionStatsDateFilter, enabled = true) =>
  useQuery({
    queryKey: retentionKeys.statsAgentPerf(params),
    queryFn: () => retentionStatsAPI.getAgentPerformance(params),
    enabled,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 2,
  });

export const useRetentionFunnelQuery = (params?: RetentionStatsDateFilter, enabled = true) =>
  useQuery({
    queryKey: retentionKeys.statsFunnel(params),
    queryFn: () => retentionStatsAPI.getFunnel(params),
    enabled,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 2,
  });

export const useRetentionTrendQuery = (days = 30, params?: RetentionStatsDateFilter, enabled = true) =>
  useQuery({
    queryKey: retentionKeys.statsTrend(days, params),
    queryFn: () => retentionStatsAPI.getTrend(days, params),
    enabled,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 2,
  });

export const useCalledCustomersQuery = (enabled = true) =>
  useQuery({
    queryKey: retentionKeys.calledCustomers(),
    queryFn: () => retentionStatsAPI.getCalledCustomers(),
    enabled,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: 2,
  });
