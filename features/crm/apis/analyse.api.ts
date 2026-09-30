import { api } from "@/services/api";
import {
  IAgentPerf,
  ICohortePublic,
  ICohortesFiltres,
  IComparatifPublics,
  ICouponsStats,
  IPareto,
  IPeriode,
  IQualite,
  IRapport,
  ITendance,
  IVentes,
  IVentesFiltres,
  IVerbatims,
  IVerbatimsFiltres,
  IVueEnsemble,
} from "../types/analyse.type";
import { telecharger, versQuery } from "../utils/requete";

const BASE = "/crm/analytics";

export const analyseAPI = {
  /** Rapport d'activité : la période comparée à la précédente. */
  rapport: (filtres?: IPeriode) => api.get<IRapport>(`${BASE}/rapport${versQuery(filtres)}`),

  /** Le même rapport en PDF, avec les filtres de l'écran. */
  rapportPdf: (filtres?: IPeriode) =>
    telecharger(`${BASE}/rapport/pdf`, filtres ?? {}, "rapport-crm.pdf"),

  publics: (p: IPeriode) => api.get<IComparatifPublics>(`${BASE}/publics${versQuery(p)}`),
  vueEnsemble: (p: IPeriode) => api.get<IVueEnsemble>(`${BASE}/overview${versQuery(p)}`),
  raisons: (p: IPeriode) => api.get<IPareto>(`${BASE}/reasons${versQuery(p)}`),
  /** Un seul public par appel : en mode « Tous », un appel par onglet. */
  cohortes: (p: ICohortesFiltres) => api.get<ICohortePublic>(`${BASE}/cohorts${versQuery(p)}`),
  coupons: (p: IPeriode) => api.get<ICouponsStats>(`${BASE}/coupons${versQuery(p)}`),
  qualite: (p: IPeriode) => api.get<IQualite>(`${BASE}/quality${versQuery(p)}`),
  agents: (p: IPeriode) => api.get<IAgentPerf[]>(`${BASE}/agents${versQuery(p)}`),
  tendance: (p: IPeriode) => api.get<ITendance>(`${BASE}/trend${versQuery(p)}`),
  ventes: (p: IVentesFiltres) => api.get<IVentes>(`${BASE}/sales${versQuery(p)}`),
  verbatims: (p: IVerbatimsFiltres) => api.get<IVerbatims>(`${BASE}/verbatims${versQuery(p)}`),
  /** Vue comparée en Excel, avec les filtres de l'écran ; inscrit à l'historique des exports. */
  exporterPublics: (p: IPeriode) =>
    telecharger(`${BASE}/export`, { ...p, vue: "publics", format: "xlsx" }, `crm-publics-${new Date().toISOString().slice(0, 10)}.xlsx`),
};
