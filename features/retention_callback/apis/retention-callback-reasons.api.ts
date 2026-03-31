import { apiRequest } from '../../../src/services/api';
import type { IRetentionCallbackReason, ICreateReasonDTO, IUpdateReasonDTO } from '../types/retention-callback.types';

const BASE = '/retention-callback/reasons';

export const retentionReasonAPI = {
  getAll: (): Promise<IRetentionCallbackReason[]> =>
    apiRequest<IRetentionCallbackReason[]>(BASE),

  create: (data: ICreateReasonDTO): Promise<IRetentionCallbackReason> =>
    apiRequest<IRetentionCallbackReason>(BASE, 'POST', data),

  update: (id: string, data: IUpdateReasonDTO): Promise<IRetentionCallbackReason> =>
    apiRequest<IRetentionCallbackReason>(`${BASE}/${id}`, 'PATCH', data),

  delete: (id: string): Promise<void> =>
    apiRequest<void>(`${BASE}/${id}`, 'DELETE'),

  reorder: (ids: string[]): Promise<IRetentionCallbackReason[]> =>
    apiRequest<IRetentionCallbackReason[]>(`${BASE}/reorder`, 'PATCH', { ids }),
};
