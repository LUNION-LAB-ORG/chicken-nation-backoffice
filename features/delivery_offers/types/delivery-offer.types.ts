import { PaginatedResponse } from "../../../types";

export type DeliveryOfferType = "FREE_DELIVERY" | "PERCENTAGE" | "FIXED_AMOUNT";
export type DeliveryOfferChannel = "APP" | "CALL_CENTER" | "BOTH";

export interface DeliveryOffer {
  id: string;
  name: string;
  description: string | null;
  type: DeliveryOfferType;
  value: number;
  min_order_amount: number | null;
  channel: DeliveryOfferChannel;
  restaurant_ids: string[];
  target_standard: boolean;
  target_premium: boolean;
  target_gold: boolean;
  days_of_week: string[];
  time_start: string | null;
  time_end: string | null;
  start_date: string;
  expiration_date: string;
  max_usage: number | null;
  max_usage_per_user: number | null;
  usage_count: number;
  is_active: boolean;
  priority: number;
  created_at: string;
  updated_at: string;
  entity_status: string;
}

export interface CreateDeliveryOfferDto {
  name: string;
  description?: string;
  type: DeliveryOfferType;
  value?: number;
  min_order_amount?: number;
  channel?: DeliveryOfferChannel;
  restaurant_ids?: string[];
  target_standard?: boolean;
  target_premium?: boolean;
  target_gold?: boolean;
  days_of_week?: string[];
  time_start?: string;
  time_end?: string;
  start_date: string;
  expiration_date: string;
  max_usage?: number;
  max_usage_per_user?: number;
  is_active?: boolean;
  priority?: number;
}

export type UpdateDeliveryOfferDto = Partial<CreateDeliveryOfferDto>;

export interface DeliveryOfferQuery {
  type?: DeliveryOfferType;
  is_active?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

export interface DeliveryOfferStats {
  total: number;
  active: number;
}

export type DeliveryOfferListResponse = PaginatedResponse<DeliveryOffer>;
