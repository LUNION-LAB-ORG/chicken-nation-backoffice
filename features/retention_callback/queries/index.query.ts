import type { IRetentionCallbackFilters } from '../types/retention-callback.types';

export const retentionKeys = {
  all: () => ['retention-callback'] as const,
  list: (filters?: IRetentionCallbackFilters) => ['retention-callback', 'list', filters] as const,
  due: () => ['retention-callback', 'due'] as const,
  detail: (id: string) => ['retention-callback', 'detail', id] as const,
  customer: (customerId: string) => ['retention-callback', 'customer', customerId] as const,
  reasons: () => ['retention-callback', 'reasons'] as const,
  calledCustomers: () => ['retention-callback', 'called-customers'] as const,
  statsOverview: (params?: unknown) => ['retention-callback', 'stats', 'overview', params] as const,
  statsByReason: (params?: unknown) => ['retention-callback', 'stats', 'by-reason', params] as const,
  statsAgentPerf: (params?: unknown) => ['retention-callback', 'stats', 'agent-performance', params] as const,
  statsFunnel: (params?: unknown) => ['retention-callback', 'stats', 'funnel', params] as const,
  statsTrend: (days?: number, params?: unknown) => ['retention-callback', 'stats', 'trend', days, params] as const,
};
