import { api } from "@/services/api";
import { telecharger, versQuery } from "../../crm/utils/requete";
import type {
  AgentAvis,
  AvisFiche,
  CompteursAvis,
  JournalAvisDTO,
  PageAvis,
  RequeteAvis,
  StatutAvisDTO,
} from "../types/avis-prive.types";

const BASE = "/avis-prives";

/** Retours privés « Ton avis compte » (contrat 4.2). Aucune route publique ici. */
export const avisPriveAPI = {
  liste: (requete: RequeteAvis) => api.get<PageAvis>(`${BASE}${versQuery(requete)}`),

  /** Ne suivent que le store (ni ressenti, ni statut, ni période, ni recherche). */
  compteurs: (restaurantId?: string) => api.get<CompteursAvis>(`${BASE}/compteurs${versQuery({ restaurantId })}`),

  /** Administrateur et call center seulement. */
  agents: () => api.get<AgentAvis[]>(`${BASE}/agents`),

  fiche: (id: string) => api.get<AvisFiche>(`${BASE}/${id}`),

  journal: (id: string, dto: JournalAvisDTO) => api.post<AvisFiche>(`${BASE}/${id}/journal`, dto),

  statut: (id: string, dto: StatutAvisDTO) => api.patch<AvisFiche>(`${BASE}/${id}/statut`, dto),

  commande: (id: string, orderId: string | null) =>
    api.patch<AvisFiche>(`${BASE}/${id}/commande`, { order_id: orderId }),

  agent: (id: string, agentId: string | null) => api.patch<AvisFiche>(`${BASE}/${id}/agent`, { agent_id: agentId }),

  ticket: (id: string, categoryId: string) => api.post<AvisFiche>(`${BASE}/${id}/ticket`, { categoryId }),

  supprimer: (id: string) => api.delete<void>(`${BASE}/${id}`),

  /** CSV du serveur (mêmes filtres que la liste, 5 000 lignes au plus). */
  exporter: (requete: RequeteAvis) =>
    telecharger(`${BASE}/export`, { ...requete, page: undefined, limit: undefined }, "avis-prives.csv"),
};
