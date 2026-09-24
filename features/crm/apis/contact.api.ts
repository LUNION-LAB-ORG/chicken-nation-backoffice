import { api } from "@/services/api";
import { PaginatedResponse } from "../../../types";
import {
  IAgent,
  IAppelDTO,
  IAssignerDTO,
  ICouponEnvoye,
  IExportLigne,
  IFileAgent,
  IContactFiche,
  IContactFiltres,
  IContactLigne,
  IContactPage,
  IPrise,
  ContactStatut,
} from "../types/contact.type";
import { telecharger, versQuery } from "../utils/requete";

const BASE = "/crm";

export const contactAPI = {
  obtenirTous: (filtres?: IContactFiltres) =>
    api.get<IContactPage>(`${BASE}/contacts${versQuery(filtres)}`),

  /** `telephone` : numéro tapé pour un client qui appelle (lecture de la fiche d'un collègue). */
  obtenirParId: (id: string, telephone?: string) =>
    api.get<IContactFiche>(`${BASE}/contacts/${id}${versQuery({ telephone })}`),

  /** Client qui appelle : sa fiche retrouvée par son numéro exact, quel que soit son agent. */
  rechercher: (telephone: string) =>
    api.get<IContactLigne[]>(`${BASE}/contacts/recherche${versQuery({ telephone })}`),

  /** Prendre un client de la file commune au moment de composer son numéro (409 si un collègue l'a déjà pris). */
  prendre: (id: string) => api.post<IPrise>(`${BASE}/contacts/${id}/prendre`, {}),

  assigner: (dto: IAssignerDTO) => api.patch<{ count: number }>(`${BASE}/contacts/assign`, dto),

  appeler: (id: string, dto: IAppelDTO) =>
    api.post<{ statut: ContactStatut }>(`${BASE}/contacts/${id}/calls`, dto),

  envoyerCoupon: (id: string, offreId?: string) =>
    api.post<ICouponEnvoye>(`${BASE}/contacts/${id}/coupons`, offreId ? { offer_id: offreId } : {}),

  renvoyerCoupon: (id: string) =>
    api.post<Omit<ICouponEnvoye, "coupon">>(`${BASE}/contacts/${id}/coupons/resend`, {}),

  maFile: () => api.get<IFileAgent>(`${BASE}/my-queue`),

  agents: () => api.get<IAgent[]>(`${BASE}/agents`),

  exports: (page = 1) => api.get<PaginatedResponse<IExportLigne>>(`${BASE}/exports${versQuery({ page })}`),

  exporter: (filtres: IContactFiltres, format: "csv" | "xlsx") => {
    const { page: _p, limit: _l, ...reste } = filtres;
    return telecharger(`${BASE}/contacts/export`, { ...reste, format }, `contacts.${format}`);
  },
};
