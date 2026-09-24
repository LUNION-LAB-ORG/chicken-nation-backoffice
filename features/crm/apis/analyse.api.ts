import { api } from "@/services/api";
import {
  IAgentPerf,
  ICohorte,
  ICouponsStats,
  IPareto,
  IPeriode,
  IQualite,
  ITendanceJour,
  IVerbatims,
  IVueEnsemble,
} from "../types/analyse.type";
import { versQuery } from "../utils/requete";

const BASE = "/crm/analytics";

export const analyseAPI = {
  vueEnsemble: (p: IPeriode) => api.get<IVueEnsemble>(`${BASE}/overview${versQuery(p)}`),
  raisons: (p: IPeriode) => api.get<IPareto>(`${BASE}/reasons${versQuery(p)}`),
  cohortes: () => api.get<ICohorte[]>(`${BASE}/cohorts`),
  coupons: (p: IPeriode) => api.get<ICouponsStats>(`${BASE}/coupons${versQuery(p)}`),
  qualite: (p: IPeriode) => api.get<IQualite>(`${BASE}/quality${versQuery(p)}`),
  agents: (p: IPeriode) => api.get<IAgentPerf[]>(`${BASE}/agents${versQuery(p)}`),
  tendance: (p: IPeriode) => api.get<ITendanceJour[]>(`${BASE}/trend${versQuery(p)}`),
  verbatims: (p: IPeriode & { search?: string; loss_reason_id?: string; agent_id?: string; page?: number }) =>
    api.get<IVerbatims>(`${BASE}/verbatims${versQuery(p)}`),
};
