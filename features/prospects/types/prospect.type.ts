import { PaginatedResponse } from "../../../types";

export type ProspectStatut =
  | "A_APPELER"
  | "A_RAPPELER"
  | "INTERESSE"
  | "COUPON_ENVOYE"
  | "NON_INTERESSE"
  | "INJOIGNABLE"
  | "CONVERTI";

export type AppelEffet = "NON_JOINT" | "A_RAPPELER" | "INTERESSE" | "NON_INTERESSE" | "NUMERO_INVALIDE";

export type EtatCoupon = "ACTIF" | "UTILISE" | "EXPIRE";

export type CanalCoupon = "WHATSAPP" | "SMS" | "AUCUN";

export interface IRef {
  id: string;
  fullname: string;
}

export interface IClientProspect {
  id: string;
  first_name: string | null;
  last_name: string | null;
  phone: string;
  email: string | null;
}

export interface ICouponResume {
  id: string;
  code: string;
  offer_label: string;
  sent_at: string;
  expires_at: string;
  used_at: string | null;
  channel: CanalCoupon;
  etat: EtatCoupon;
}

export interface IProspectLigne {
  id: string;
  nom: string;
  status: ProspectStatut;
  registered_at: string;
  call_count: number;
  last_call_at: string | null;
  last_call_outcome: AppelEffet | null;
  callback_at: string | null;
  last_comment: string | null;
  coupon_sent_at: string | null;
  converted_at: string | null;
  first_order_amount: number | null;
  abandoned_orders: number;
  assigned_at: string | null;
  campaign_id: string | null;
  assigned_to_id: string | null;
  customer: IClientProspect;
  assigned_to: IRef | null;
  campaign: { id: string; name: string; status: string } | null;
  last_call_status: { id: string; label: string } | null;
  loss_reason: { id: string; name: string } | null;
  coupon: ICouponResume | null;
}

export interface IAppel {
  id: string;
  created_at: string;
  status_label: string;
  outcome: AppelEffet;
  reached: boolean;
  attempt: number;
  comment: string | null;
  callback_at: string | null;
  agent: IRef | null;
  loss_reason: { id: string; name: string } | null;
  campaign: { id: string; name: string } | null;
}

export interface ICouponDetail extends ICouponResume {
  discount_type: "PERCENTAGE" | "FIXED_AMOUNT";
  discount_value: number;
  send_error: string | null;
  resent_count: number;
  order_amount: number | null;
  sent_by: IRef | null;
  campaign: { id: string; name: string } | null;
}

export interface IEvenement {
  id: string;
  type: string;
  label: string;
  created_at: string;
  actor: IRef | null;
  campaign: { id: string; name: string } | null;
}

export interface IProspectFiche extends Omit<IProspectLigne, "coupon" | "customer"> {
  customer: IClientProspect & { created_at: string; last_login_at: string | null; whatsapp_opt_in: boolean };
  coupon: ICouponResume | null;
  first_reached_at: string | null;
  qualified_at: string | null;
  delai_conversion_jours: number | null;
  appels: IAppel[];
  coupons: ICouponDetail[];
  campagnes: {
    id: string;
    joined_at: string;
    released_at: string | null;
    release_reason: string | null;
    converted_at: string | null;
    campaign: { id: string; name: string; status: string; lead_agent_id: string };
    agent: IRef | null;
  }[];
  journal: IEvenement[];
  commande: {
    id: string;
    reference: string;
    created_at: string;
    amount: number;
    status: string;
    type: string;
    restaurant: { name: string } | null;
  } | null;
  paiements_abandonnes: { id: string; reference: string; created_at: string; amount: number }[];
  acquisition: {
    id: string;
    platform: string;
    status: string;
    created_at: string;
    coupon_sent_at: string | null;
    restaurant: { name: string } | null;
  }[];
}

export interface IProspectFiltres {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  agent_id?: string;
  campaign_id?: string;
  call_status_id?: string;
  loss_reason_id?: string;
  coupon?: "AUCUN" | EtatCoupon;
  registered_from?: string;
  registered_to?: string;
  last_call_from?: string;
  last_call_to?: string;
  never_called?: "true";
  abandoned?: "true";
  sort?: "inscription_desc" | "inscription_asc" | "appel_desc" | "appel_asc" | "tentatives_desc";
}

export type IProspectPage = PaginatedResponse<IProspectLigne>;

export interface IAgent {
  id: string;
  fullname: string;
  role: string;
  image: string | null;
  portefeuille: number;
}

export interface IFileAgent {
  rappels: IProspectLigne[];
  interesses: IProspectLigne[];
  nouveaux: IProspectLigne[];
  relances: IProspectLigne[];
  coupons: IProspectLigne[];
  rappels_planifies: IProspectLigne[];
  indicateurs: {
    appels_jour: number;
    joints_jour: number;
    coupons_jour: number;
    conversions_jour: number;
    portefeuille: number;
  };
}

export interface IAppelDTO {
  call_status_id: string;
  loss_reason_id?: string;
  comment?: string;
  callback_at?: string;
}

export interface IAssignerDTO {
  prospect_ids: string[];
  agent_id: string | null;
}

export interface ICouponEnvoye {
  coupon: ICouponResume & { campaign_id: string | null };
  message: string;
  canal: CanalCoupon;
  envoye: boolean;
}

export interface IExportLigne {
  id: string;
  kind: string;
  format: string;
  filters: Record<string, string> | null;
  row_count: number;
  created_at: string;
  user: IRef | null;
}
