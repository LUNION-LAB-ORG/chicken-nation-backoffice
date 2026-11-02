import { api } from "@/services/api";
import { telecharger, versQuery } from "../../crm/utils/requete";
import type {
  AgentAvis,
  AgentAvisDTO,
  AvisFiche,
  CommandeAvisDTO,
  CompteursAvis,
  JournalAvisDTO,
  PageAvis,
  RequeteAvis,
  StatutAvisDTO,
  TicketAvisDTO,
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

  /** Corps fait par `corpsCommande` : la commande lue part avec (409 si elle a changé). */
  commande: (id: string, dto: CommandeAvisDTO) => api.patch<AvisFiche>(`${BASE}/${id}/commande`, dto),

  /** Corps fait par `corpsAgent` : l'agent lu part avec (409 s'il a changé). */
  agent: (id: string, dto: AgentAvisDTO) => api.patch<AvisFiche>(`${BASE}/${id}/agent`, dto),

  /** Corps fait par `corpsTicket` : la commande vue dans la fenêtre part avec. */
  ticket: (id: string, dto: TicketAvisDTO) => api.post<AvisFiche>(`${BASE}/${id}/ticket`, dto),

  supprimer: (id: string) => api.delete<void>(`${BASE}/${id}`),

  /** CSV du serveur (mêmes filtres que la liste, 5 000 lignes au plus). */
  exporter: (requete: RequeteAvis) =>
    telecharger(`${BASE}/export`, { ...requete, page: undefined, limit: undefined }, "avis-prives.csv"),
};
