import { api } from "@/services/api";
import { PaginatedResponse } from "../../../types";
import {
  IAgent,
  IAppelDTO,
  IAssignerDTO,
  ICouponEnvoye,
  IExportLigne,
  IFileAgent,
  IProspectFiche,
  IProspectFiltres,
  IProspectPage,
  ProspectStatut,
} from "../types/prospect.type";
import { telecharger, versQuery } from "../utils/requete";

const BASE = "/conversion";

export const prospectAPI = {
  obtenirTous: (filtres?: IProspectFiltres) =>
    api.get<IProspectPage>(`${BASE}/prospects${versQuery(filtres)}`),

  obtenirParId: (id: string) => api.get<IProspectFiche>(`${BASE}/prospects/${id}`),

  assigner: (dto: IAssignerDTO) => api.patch<{ count: number }>(`${BASE}/prospects/assign`, dto),

  appeler: (id: string, dto: IAppelDTO) =>
    api.post<{ statut: ProspectStatut }>(`${BASE}/prospects/${id}/calls`, dto),

  envoyerCoupon: (id: string, offreId?: string) =>
    api.post<ICouponEnvoye>(`${BASE}/prospects/${id}/coupons`, offreId ? { offer_id: offreId } : {}),

  renvoyerCoupon: (id: string) =>
    api.post<Omit<ICouponEnvoye, "coupon">>(`${BASE}/prospects/${id}/coupons/resend`, {}),

  maFile: () => api.get<IFileAgent>(`${BASE}/my-queue`),

  agents: () => api.get<IAgent[]>(`${BASE}/agents`),

  exports: (page = 1) => api.get<PaginatedResponse<IExportLigne>>(`${BASE}/exports${versQuery({ page })}`),

  exporter: (filtres: IProspectFiltres, format: "csv" | "xlsx") => {
    const { page: _p, limit: _l, ...reste } = filtres;
    return telecharger(`${BASE}/prospects/export`, { ...reste, format }, `prospects.${format}`);
  },
};
