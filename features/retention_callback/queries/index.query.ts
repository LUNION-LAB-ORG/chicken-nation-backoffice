import type { IRetentionCallbackFilters } from '../types/retention-callback.types';

export const retentionKeys = {
  all: () => ['retention-callback'] as const,
  list: (filters?: IRetentionCallbackFilters) => ['retention-callback', 'list', filters] as const,
  due: () => ['retention-callback', 'due'] as const,
  detail: (id: string) => ['retention-callback', 'detail', id] as const,
  customer: (customerId: string) => ['retention-callback', 'customer', customerId] as const,
  reasons: () => ['retention-callback', 'reasons'] as const,
  statsOverview: () => ['retention-callback', 'stats', 'overview'] as const,
  statsByReason: () => ['retention-callback', 'stats', 'by-reason'] as const,
  statsAgentPerf: () => ['retention-callback', 'stats', 'agent-performance'] as const,
  statsFunnel: () => ['retention-callback', 'stats', 'funnel'] as const,
  statsTrend: (days?: number) => ['retention-callback', 'stats', 'trend', days] as const,
};
