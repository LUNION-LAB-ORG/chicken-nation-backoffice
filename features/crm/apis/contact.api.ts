import { api } from "@/services/api";
import { PaginatedResponse } from "../../../types";
import {
  IAgent,
  IAppelDTO,
  IAssignation,
  IAssignerDTO,
  ICouponEnvoye,
  IExportLigne,
  IFileAgent,
  IContactFiche,
  IIdentiteMaj,
  IRenommerDTO,
  IContactFiltres,
  IContactLigne,
  IContactPage,
  ILignesFileFiltres,
  IRepartition,
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

  /** Décompte par public et par état de compte, sur le périmètre filtré. */
  repartition: (filtres?: IContactFiltres) =>
    api.get<IRepartition>(`${BASE}/contacts/repartition${versQuery(filtres)}`),

  /** Client qui appelle : sa fiche retrouvée par son numéro exact, quel que soit son agent. */
  rechercher: (telephone: string) =>
    api.get<IContactLigne[]>(`${BASE}/contacts/recherche${versQuery({ telephone })}`),

  /** Prendre un client de la file commune au moment de composer son numéro (409 si un collègue l'a déjà pris). */
  prendre: (id: string) => api.post<IPrise>(`${BASE}/contacts/${id}/prendre`, {}),
  /** Annuaire : décider de travailler un client qui commande déjà. */
  prendreEnCharge: (id: string) =>
    api.post<{ success: boolean }>(`${BASE}/contacts/${id}/prendre-en-charge`, {}),

  /** Nommer un contact sans nom ; le serveur écrit aussi sur son compte applicatif. */
  renommer: (id: string, dto: IRenommerDTO) =>
    api.patch<IIdentiteMaj>(`${BASE}/contacts/${id}/identite`, dto),

  assigner: (dto: IAssignerDTO) => api.patch<IAssignation>(`${BASE}/contacts/assign`, dto),

  appeler: (id: string, dto: IAppelDTO) =>
    api.post<{ statut: ContactStatut }>(`${BASE}/contacts/${id}/calls`, dto),

  envoyerCoupon: (id: string, offreId?: string) =>
    api.post<ICouponEnvoye>(`${BASE}/contacts/${id}/coupons`, offreId ? { offer_id: offreId } : {}),

  renvoyerCoupon: (id: string) =>
    api.post<Omit<ICouponEnvoye, "coupon">>(`${BASE}/contacts/${id}/coupons/resend`, {}),

  maFile: () => api.get<IFileAgent>(`${BASE}/my-queue`),

  /** Lignes d'un dossier de « Ma file », une rubrique à la fois, page par page. */
  lignesMaFile: (filtres: ILignesFileFiltres) =>
    api.get<PaginatedResponse<IContactLigne>>(`${BASE}/my-queue/lignes${versQuery(filtres)}`),

  agents: () => api.get<IAgent[]>(`${BASE}/agents`),

  exports: (page = 1) => api.get<PaginatedResponse<IExportLigne>>(`${BASE}/exports${versQuery({ page })}`),

  exporter: (filtres: IContactFiltres, format: "csv" | "xlsx") => {
    const { page: _p, limit: _l, ...reste } = filtres;
    return telecharger(`${BASE}/contacts/export`, { ...reste, format }, `contacts.${format}`);
  },
};
