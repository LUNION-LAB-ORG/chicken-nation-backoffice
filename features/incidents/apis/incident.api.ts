import { api } from "@/services/api";
import { telecharger, versQuery } from "../../crm/utils/requete";
import type {
  AgentIncident,
  AssignerIncidentDTO,
  Bareme,
  CategorieIncident,
  CloturerIncidentDTO,
  CompteursIncidents,
  ContexteCommande,
  FiltresHistorique,
  FiltresIncidents,
  IncidentFiche,
  IncidentOuvert,
  IncidentPole,
  IncidentsCommande,
  PageIncidents,
  ReglagesIncident,
  ResoudreIncidentDTO,
  RouvrirIncidentDTO,
  SignalerIncidentDTO,
  StatistiquesIncidents,
  TableauIncidents,
} from "../types/incident.types";

const BASE = "/incidents";

/** Incidents sur commande (contrat, partie 4). */
export const incidentAPI = {
  reglages: () => api.get<ReglagesIncident>(`${BASE}/reglages`),

  enregistrerReglages: (dto: { bareme?: Bareme; validite_jours?: number; bon_restaurant?: boolean }) =>
    api.put<ReglagesIncident>(`${BASE}/reglages`, dto),

  creerCategorie: (dto: { nom: string; pole: IncidentPole; delai_heures: number }) =>
    api.post<CategorieIncident>(`${BASE}/categories`, dto),

  modifierCategorie: (id: string, dto: Partial<{ nom: string; pole: IncidentPole; delai_heures: number; actif: boolean }>) =>
    api.patch<CategorieIncident>(`${BASE}/categories/${id}`, dto),

  compteurs: (restaurantId?: string) => api.get<CompteursIncidents>(`${BASE}/compteurs${versQuery({ restaurantId })}`),

  tableau: (filtres: FiltresIncidents) => api.get<TableauIncidents>(`${BASE}/tableau${versQuery(filtres)}`),

  liste: (filtres: FiltresHistorique) => api.get<PageIncidents>(`${BASE}${versQuery(filtres)}`),

  statistiques: (q: { du?: string; au?: string; restaurantId?: string }) =>
    api.get<StatistiquesIncidents>(`${BASE}/statistiques${versQuery(q)}`),

  /** Administrateur et call center. */
  agents: () => api.get<AgentIncident[]>(`${BASE}/agents`),

  chercherCommandes: (recherche: string) => api.get<ContexteCommande[]>(`${BASE}/commandes${versQuery({ recherche })}`),

  parCommande: (orderId: string) => api.get<IncidentsCommande>(`${BASE}/commande/${orderId}`),

  ouverts: (restaurantId?: string) => api.get<IncidentOuvert[]>(`${BASE}/ouverts${versQuery({ restaurantId })}`),

  signaler: (dto: SignalerIncidentDTO) => api.post<IncidentFiche>(BASE, dto),

  fiche: (id: string) => api.get<IncidentFiche>(`${BASE}/${id}`),

  /** Sans responsable ni agent : « Prendre en charge ». */
  assigner: (id: string, dto: AssignerIncidentDTO) => api.post<IncidentFiche>(`${BASE}/${id}/assigner`, dto),

  resoudre: (id: string, dto: ResoudreIncidentDTO) => api.post<IncidentFiche>(`${BASE}/${id}/resoudre`, dto),

  cloturer: (id: string, dto: CloturerIncidentDTO) => api.post<IncidentFiche>(`${BASE}/${id}/cloturer`, dto),

  rouvrir: (id: string, dto: RouvrirIncidentDTO) => api.post<IncidentFiche>(`${BASE}/${id}/rouvrir`, dto),

  noter: (id: string, note: string) => api.post<IncidentFiche>(`${BASE}/${id}/notes`, { note }),

  creerBon: (id: string) => api.post<IncidentFiche>(`${BASE}/${id}/bon`, {}),

  renvoyerSms: (id: string) => api.post<IncidentFiche>(`${BASE}/${id}/bon/sms`, {}),

  /** CSV du serveur (mêmes filtres que l'historique, 5 000 lignes au plus). */
  exporter: (filtres: FiltresHistorique) =>
    telecharger(`${BASE}/export`, { ...filtres, page: undefined, limit: undefined }, "incidents.csv"),
};
