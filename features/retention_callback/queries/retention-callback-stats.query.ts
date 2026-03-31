import { useQuery } from '@tanstack/react-query';
import { retentionStatsAPI } from '../apis/retention-callback-stats.api';
import { retentionKeys } from './index.query';

export const useRetentionOverviewQuery = (enabled = true) =>
  useQuery({
    queryKey: retentionKeys.statsOverview(),
    queryFn: () => retentionStatsAPI.getOverview(),
    enabled,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 2,
  });

export const useRetentionByReasonQuery = (enabled = true) =>
  useQuery({
    queryKey: retentionKeys.statsByReason(),
    queryFn: () => retentionStatsAPI.getByReason(),
    enabled,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 2,
  });

export const useRetentionAgentPerformanceQuery = (enabled = true) =>
  useQuery({
    queryKey: retentionKeys.statsAgentPerf(),
    queryFn: () => retentionStatsAPI.getAgentPerformance(),
    enabled,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 2,
  });

export const useRetentionFunnelQuery = (enabled = true) =>
  useQuery({
    queryKey: retentionKeys.statsFunnel(),
    queryFn: () => retentionStatsAPI.getFunnel(),
    enabled,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 2,
  });

export const useRetentionTrendQuery = (days = 30, enabled = true) =>
  useQuery({
    queryKey: retentionKeys.statsTrend(days),
    queryFn: () => retentionStatsAPI.getTrend(days),
    enabled,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 2,
  });
