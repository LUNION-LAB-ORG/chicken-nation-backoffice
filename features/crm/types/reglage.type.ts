import { AppelEffet } from "./contact.type";

export interface IStatutAppel {
  id: string;
  label: string;
  outcome: AppelEffet;
  position: number;
  is_active: boolean;
}

export interface IRaison {
  id: string;
  name: string;
  description: string | null;
  position: number;
  is_active: boolean;
}

export type TypeRemise = "PERCENTAGE" | "FIXED_AMOUNT";

export interface IOffre {
  id: string;
  label: string;
  description: string | null;
  discount_type: TypeRemise;
  discount_value: number;
  max_discount_amount: number | null;
  min_order_amount: number;
  validity_days: number;
  position: number;
  is_active: boolean;
}

export interface IReglages {
  max_attempts: number;
  alert_delay_hours: number;
  inactive_days: number;
  whatsapp_template_sid: string;
  message_template: string;
  app_link: string;
  default_offer_id: string;
}

export type IStatutAppelDTO = Partial<Pick<IStatutAppel, "label" | "outcome" | "is_active">>;
export type IRaisonDTO = Partial<Pick<IRaison, "name" | "description" | "is_active">>;
export type IOffreDTO = Partial<
  Pick<
    IOffre,
    | "label"
    | "description"
    | "discount_type"
    | "discount_value"
    | "max_discount_amount"
    | "min_order_amount"
    | "validity_days"
    | "is_active"
  >
>;
