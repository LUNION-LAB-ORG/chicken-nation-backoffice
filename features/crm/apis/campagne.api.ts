import { api } from "@/services/api";
import { Public } from "../types/contact.type";
import {
  IApercu,
  IApercuInput,
  ICampagne,
  ICampagneDTO,
  ICampagnesFiltres,
  ICampagneStats,
  ICloture,
  IComparatifLigne,
  ILancement,
} from "../types/campagne.type";
import { telecharger, versQuery } from "../utils/requete";

const BASE = "/crm/campaigns";

export const campagneAPI = {
  obtenirTous: (filtres?: ICampagnesFiltres) => api.get<ICampagne[]>(`${BASE}${versQuery(filtres)}`),
  obtenirParId: (id: string) => api.get<ICampagne>(`${BASE}/${id}`),
  ajouter: (dto: ICampagneDTO) => api.post<ICampagne>(BASE, dto),
  modifier: (id: string, dto: Partial<ICampagneDTO>) => api.patch<ICampagne>(`${BASE}/${id}`, dto),
  /** Population qu'un lancement prendrait maintenant ; rien n'est écrit. */
  apercu: (dto: IApercuInput) => api.post<IApercu>(`${BASE}/preview`, dto),
  lancer: (id: string) => api.post<ILancement>(`${BASE}/${id}/launch`, {}),
  suspendre: (id: string) => api.post<ICampagne>(`${BASE}/${id}/suspend`, {}),
  reprendre: (id: string) => api.post<ICampagne>(`${BASE}/${id}/resume`, {}),
  terminer: (id: string) => api.post<ICloture>(`${BASE}/${id}/complete`, {}),
  distribuer: (id: string, inclureNonAppeles: boolean) =>
    api.post<{ repartis: number; par_agent: Record<string, number> }>(`${BASE}/${id}/distribute`, {
      inclure_non_appeles: inclureNonAppeles,
    }),
  equipe: (id: string, agentIds: string[], piloteId?: string) =>
    api.patch<ICampagne>(`${BASE}/${id}/team`, { agent_ids: agentIds, ...(piloteId && { lead_agent_id: piloteId }) }),
  stats: (id: string) => api.get<ICampagneStats>(`${BASE}/${id}/stats`),
  comparer: (segment?: Public) => api.get<IComparatifLigne[]>(`${BASE}/compare${versQuery({ segment })}`),
  // L'en-tête Content-Disposition n'est pas exposé en CORS : le nom de repli reprend celui du serveur.
  exporterComparatif: (segment?: Public) =>
    telecharger(
      `${BASE}/compare/export`,
      { segment },
      `comparatif-campagnes${segment ? `-${segment.toLowerCase()}` : ""}.xlsx`,
    ),
  rapport: (id: string, format: "xlsx" | "pdf") =>
    telecharger(`${BASE}/${id}/report`, { format }, `rapport-campagne.${format}`),
};
