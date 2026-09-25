import { PaginatedResponse } from "../../../types";

export type ContactStatut =
  | "A_APPELER"
  | "A_RAPPELER"
  | "INTERESSE"
  | "COUPON_ENVOYE"
  | "NON_INTERESSE"
  | "INJOIGNABLE"
  | "CONVERTI";

export type AppelEffet = "NON_JOINT" | "A_RAPPELER" | "INTERESSE" | "NON_INTERESSE" | "NUMERO_INVALIDE";

export type EtatCoupon = "ACTIF" | "UTILISE" | "EXPIRE";

/** Public du CRM : d'où vient le contact et ce qu'on attend de lui. */
export type Public = "JAMAIS_COMMANDE" | "INACTIF" | "GLOVO" | "YANGO";

/** INCONNU : coupon repris de l'ancienne acquisition, canal non noté à l'époque. */
export type CanalCoupon = "WHATSAPP" | "SMS" | "AUCUN" | "INCONNU";

export interface IRef {
  id: string;
  fullname: string;
}

export interface IClientContact {
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

export interface IContactLigne {
  id: string;
  /** Nom du compte appli, sinon celui relevé à la capture, sinon « Client sans nom ». */
  nom: string;
  /** Numéro à appeler : celui du compte, sinon celui de la capture. */
  telephone: string;
  /** Numéro et nom relevés à la capture Glovo/Yango. */
  phone: string | null;
  name: string | null;
  status: ContactStatut;
  segment: Public;
  /** Entrée dans le public : l'inscription, ou le jour où il est devenu inactif. */
  segment_since: string;
  cycle: number;
  last_order_at: string | null;
  /** Inscription sur l'application : absente pour un client Glovo/Yango sans compte. */
  registered_at: string | null;
  call_count: number;
  last_call_at: string | null;
  last_call_outcome: AppelEffet | null;
  callback_at: string | null;
  last_comment: string | null;
  coupon_sent_at: string | null;
  converted_at: string | null;
  conversion_amount: number | null;
  abandoned_orders: number;
  assigned_at: string | null;
  campaign_id: string | null;
  assigned_to_id: string | null;
  /** Absent pour un client Glovo/Yango qui n'a pas de compte sur l'application. */
  customer: IClientContact | null;
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

/** Commande Glovo/Yango relevée en caisse pour ce client. */
export interface ICapture {
  id: string;
  platform: "GLOVO" | "YANGO";
  order_number: string;
  name: string | null;
  created_at: string;
  restaurant: { name: string } | null;
  creator: { fullname: string } | null;
}

/**
 * Ce que l'utilisateur peut faire de la fiche : tout (gestion), la traiter
 * (sienne, ou prise dans la file commune en agissant), seulement la lire
 * (client d'un collègue retrouvé par son numéro), ou la consulter (lecteur :
 * marketing, manager ; tout voir, téléphone compris, aucun geste).
 */
export type ModeFiche = "gestion" | "sien" | "commune" | "lecture" | "consultation";

export interface IContactFiche extends Omit<IContactLigne, "coupon" | "customer"> {
  customer: (IClientContact & { created_at: string; last_login_at: string | null; whatsapp_opt_in: boolean }) | null;
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
  /** Ce qu'un ancien client a acheté (absent pour un inscrit qui n'a jamais commandé). */
  achats: {
    commandes: number;
    montant: number;
    premiere: string | null;
    derniere: string | null;
    canal: "APPLICATION" | "CENTRE_APPEL" | "MIXTE";
  } | null;
  captures: ICapture[];
  mode: ModeFiche;
}

export interface IContactFiltres {
  page?: number;
  limit?: number;
  search?: string;
  segment?: Public;
  status?: string;
  agent_id?: string;
  campaign_id?: string;
  call_status_id?: string;
  loss_reason_id?: string;
  coupon?: "AUCUN" | EtatCoupon;
  registered_from?: string;
  registered_to?: string;
  /** Restaurant où le client a été capté (Glovo/Yango). */
  restaurant_id?: string;
  captured_from?: string;
  captured_to?: string;
  last_call_from?: string;
  last_call_to?: string;
  never_called?: "true";
  abandoned?: "true";
  sort?:
    | "entree_desc"
    | "inscription_desc"
    | "inscription_asc"
    | "appel_desc"
    | "appel_asc"
    | "tentatives_desc"
    | "derniere_commande_asc"
    | "derniere_commande_desc";
}

export type IContactPage = PaginatedResponse<IContactLigne>;

export interface IAgent {
  id: string;
  fullname: string;
  role: string;
  image: string | null;
  portefeuille: number;
}

export interface IFileAgent {
  rappels: IContactLigne[];
  interesses: IContactLigne[];
  nouveaux: IContactLigne[];
  relances: IContactLigne[];
  coupons: IContactLigne[];
  rappels_planifies: IContactLigne[];
  /** File commune Glovo/Yango (J+1) : le premier agent qui compose le numéro prend le client. */
  commune: IContactLigne[];
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

export interface IPrise {
  pris: boolean;
  assigned_to_id: string | null;
}

export interface IAssignerDTO {
  contact_ids: string[];
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
