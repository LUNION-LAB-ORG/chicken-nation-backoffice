import { api } from "@/services/api";
import type {
  IAnswerCallResponse,
  ICall,
  ICallsConfig,
  IStartCallResponse,
} from "../types/call.type";

const BASE = "/calls";

export const callsApi = {
  start: (data: { targetKind?: string; restaurantId?: string }) =>
    api.post<IStartCallResponse>(BASE, data),
  answer: (id: string) => api.post<IAnswerCallResponse>(`${BASE}/${id}/answer`, {}),
  reject: (id: string) => api.post<{ status: string }>(`${BASE}/${id}/reject`, {}),
  hangup: (id: string) => api.post<{ status: string }>(`${BASE}/${id}/hangup`, {}),
  history: (limit = 30) => api.get<ICall[]>(`${BASE}/history?limit=${limit}`),
  getConfig: () => api.get<ICallsConfig>(`${BASE}/config`),
  updateConfig: (data: ICallsConfig) => api.put<ICallsConfig>(`${BASE}/config`, data),
};
