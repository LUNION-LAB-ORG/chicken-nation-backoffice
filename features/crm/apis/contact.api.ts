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
  IContactPage,
  ContactStatut,
} from "../types/contact.type";
import { telecharger, versQuery } from "../utils/requete";

const BASE = "/crm";

export const contactAPI = {
  obtenirTous: (filtres?: IContactFiltres) =>
    api.get<IContactPage>(`${BASE}/contacts${versQuery(filtres)}`),

  obtenirParId: (id: string) => api.get<IContactFiche>(`${BASE}/contacts/${id}`),

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
