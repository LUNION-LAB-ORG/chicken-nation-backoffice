import { api } from "@/services/api";
import { CampagneStatut, ICampagne, ICampagneDTO, ICampagneStats, IComparatifLigne } from "../types/campagne.type";
import { telecharger, versQuery } from "../utils/requete";

const BASE = "/crm/campaigns";

export const campagneAPI = {
  obtenirTous: (status?: CampagneStatut) => api.get<ICampagne[]>(`${BASE}${versQuery({ status })}`),
  obtenirParId: (id: string) => api.get<ICampagne>(`${BASE}/${id}`),
  ajouter: (dto: ICampagneDTO) => api.post<ICampagne>(BASE, dto),
  modifier: (id: string, dto: Partial<ICampagneDTO>) => api.patch<ICampagne>(`${BASE}/${id}`, dto),
  lancer: (id: string) => api.post<{ cibles: number; repartis: number }>(`${BASE}/${id}/launch`, {}),
  suspendre: (id: string) => api.post<ICampagne>(`${BASE}/${id}/suspend`, {}),
  reprendre: (id: string) => api.post<ICampagne>(`${BASE}/${id}/resume`, {}),
  terminer: (id: string) => api.post<{ liberes: number }>(`${BASE}/${id}/complete`, {}),
  distribuer: (id: string, inclureNonAppeles: boolean) =>
    api.post<{ repartis: number; par_agent: Record<string, number> }>(`${BASE}/${id}/distribute`, {
      inclure_non_appeles: inclureNonAppeles,
    }),
  equipe: (id: string, agentIds: string[], piloteId?: string) =>
    api.patch<ICampagne>(`${BASE}/${id}/team`, { agent_ids: agentIds, ...(piloteId && { lead_agent_id: piloteId }) }),
  stats: (id: string) => api.get<ICampagneStats>(`${BASE}/${id}/stats`),
  comparer: () => api.get<IComparatifLigne[]>(`${BASE}/compare`),
  rapport: (id: string, format: "xlsx" | "pdf") =>
    telecharger(`${BASE}/${id}/report`, { format }, `rapport-campagne.${format}`),
};
