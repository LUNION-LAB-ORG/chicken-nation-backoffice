import { apiRequest } from '../../../src/services/api';
import type {
  IRetentionOverview,
  IRetentionByReason,
  IRetentionAgentPerformance,
  IRetentionFunnel,
  IRetentionTrend,
} from '../types/retention-callback.types';

const BASE = '/retention-callback/stats';

export interface RetentionStatsDateFilter {
  dateFrom?: string;
  dateTo?: string;
}

function buildDateQuery(params?: RetentionStatsDateFilter): string {
  if (!params?.dateFrom && !params?.dateTo) return '';
  const qs = new URLSearchParams();
  if (params.dateFrom) qs.append('dateFrom', params.dateFrom);
  if (params.dateTo) qs.append('dateTo', params.dateTo);
  return `?${qs.toString()}`;
}

export const retentionStatsAPI = {
  getOverview: (params?: RetentionStatsDateFilter): Promise<IRetentionOverview> =>
    apiRequest<IRetentionOverview>(`${BASE}/overview${buildDateQuery(params)}`),

  getByReason: (params?: RetentionStatsDateFilter): Promise<IRetentionByReason[]> =>
    apiRequest<IRetentionByReason[]>(`${BASE}/by-reason${buildDateQuery(params)}`),

  getAgentPerformance: (params?: RetentionStatsDateFilter): Promise<IRetentionAgentPerformance[]> =>
    apiRequest<IRetentionAgentPerformance[]>(`${BASE}/agent-performance${buildDateQuery(params)}`),

  getFunnel: (params?: RetentionStatsDateFilter): Promise<IRetentionFunnel> =>
    apiRequest<IRetentionFunnel>(`${BASE}/funnel${buildDateQuery(params)}`),

  getTrend: (days = 30, params?: RetentionStatsDateFilter): Promise<IRetentionTrend[]> => {
    const qs = new URLSearchParams();
    qs.append('days', String(days));
    if (params?.dateFrom) qs.append('dateFrom', params.dateFrom);
    if (params?.dateTo) qs.append('dateTo', params.dateTo);
    return apiRequest<IRetentionTrend[]>(`${BASE}/trend?${qs.toString()}`);
  },

  getCalledCustomers: (): Promise<{ calledCustomerIds: string[]; customerStatuses: Record<string, string> }> =>
    apiRequest(`/retention-callback/called-customers`),
};
