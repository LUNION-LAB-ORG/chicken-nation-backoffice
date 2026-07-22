import { api } from "@/services/api";
import type {
  IActiveCallRestore,
  IAnswerCallResponse,
  ICall,
  ICallStatus,
  ICallsConfig,
  IIncomingCallEvent,
  IStartCallPayload,
  IStartCallResponse,
} from "../types/call.type";

const BASE = "/calls";

export const callsApi = {
  start: (data: IStartCallPayload) => api.post<IStartCallResponse>(BASE, data),
  answer: (id: string) => api.post<IAnswerCallResponse>(`${BASE}/${id}/answer`, {}),
  reject: (id: string) => api.post<{ status: string }>(`${BASE}/${id}/reject`, {}),
  hangup: (id: string) => api.post<{ status: string }>(`${BASE}/${id}/hangup`, {}),
  history: (limit = 30) => api.get<ICall[]>(`${BASE}/history?limit=${limit}`),
  /** Statut d'un appel — polling de convergence (filet des events socket). */
  getStatus: (id: string) => api.get<ICallStatus>(`${BASE}/${id}`),
  /** Appels qui sonnent encore pour moi (resynchro à la connexion). */
  ringing: () => api.get<IIncomingCallEvent[]>(`${BASE}/ringing`),
  /** Mon appel actif (restauré après un rechargement de page) — jeton frais. */
  active: () => api.get<IActiveCallRestore | null>(`${BASE}/active`),
  getConfig: () => api.get<ICallsConfig>(`${BASE}/config`),
  updateConfig: (data: ICallsConfig) => api.put<ICallsConfig>(`${BASE}/config`, data),
};
