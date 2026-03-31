import { apiRequest } from '../../../src/services/api';
import type {
  IRetentionCallback,
  IRetentionCallbackPaginated,
  IRetentionCallbackFilters,
  ICreateRetentionCallbackDTO,
  IUpdateRetentionCallbackDTO,
} from '../types/retention-callback.types';

const BASE = '/retention-callback';

function buildQuery(filters: IRetentionCallbackFilters): string {
  const params = new URLSearchParams();
  if (filters.page) params.append('page', String(filters.page));
  if (filters.limit) params.append('limit', String(filters.limit));
  if (filters.status?.length) filters.status.forEach((s) => params.append('status', s));
  if (filters.reason_id?.length) filters.reason_id.forEach((r) => params.append('reason_id', r));
  if (filters.caller_user_id?.length) filters.caller_user_id.forEach((c) => params.append('caller_user_id', c));
  if (filters.customer_id) params.append('customer_id', filters.customer_id);
  if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
  if (filters.dateTo) params.append('dateTo', filters.dateTo);
  if (filters.search) params.append('search', filters.search);
  const str = params.toString();
  return str ? `?${str}` : '';
}

export const retentionCallbackAPI = {
  getAll: (filters: IRetentionCallbackFilters = {}): Promise<IRetentionCallbackPaginated> =>
    apiRequest<IRetentionCallbackPaginated>(`${BASE}${buildQuery(filters)}`),

  getDue: (): Promise<IRetentionCallback[]> =>
    apiRequest<IRetentionCallback[]>(`${BASE}/due`),

  getByCustomer: (customerId: string): Promise<IRetentionCallback[]> =>
    apiRequest<IRetentionCallback[]>(`${BASE}/customer/${customerId}`),

  getOne: (id: string): Promise<IRetentionCallback> =>
    apiRequest<IRetentionCallback>(`${BASE}/${id}`),

  create: (data: ICreateRetentionCallbackDTO): Promise<IRetentionCallback> =>
    apiRequest<IRetentionCallback>(BASE, 'POST', data),

  update: (id: string, data: IUpdateRetentionCallbackDTO): Promise<IRetentionCallback> =>
    apiRequest<IRetentionCallback>(`${BASE}/${id}`, 'PATCH', data),

  delete: (id: string): Promise<void> =>
    apiRequest<void>(`${BASE}/${id}`, 'DELETE'),
};
