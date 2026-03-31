import { apiRequest } from '../../../src/services/api';
import type {
  IRetentionOverview,
  IRetentionByReason,
  IRetentionAgentPerformance,
  IRetentionFunnel,
  IRetentionTrend,
} from '../types/retention-callback.types';

const BASE = '/retention-callback/stats';

export const retentionStatsAPI = {
  getOverview: (): Promise<IRetentionOverview> =>
    apiRequest<IRetentionOverview>(`${BASE}/overview`),

  getByReason: (): Promise<IRetentionByReason[]> =>
    apiRequest<IRetentionByReason[]>(`${BASE}/by-reason`),

  getAgentPerformance: (): Promise<IRetentionAgentPerformance[]> =>
    apiRequest<IRetentionAgentPerformance[]>(`${BASE}/agent-performance`),

  getFunnel: (): Promise<IRetentionFunnel> =>
    apiRequest<IRetentionFunnel>(`${BASE}/funnel`),

  getTrend: (days = 30): Promise<IRetentionTrend[]> =>
    apiRequest<IRetentionTrend[]>(`${BASE}/trend?days=${days}`),
};
