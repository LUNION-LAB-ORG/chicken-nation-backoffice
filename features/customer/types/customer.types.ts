import { EntityStatus } from "../../../types";
import { Comment } from "../../comments/types/comment.types";
import { Conversation, Message, TicketMessage, TicketThread } from "../../messages/types/messages.types";
import { Order } from "../../orders/types/order.types";
import { PromotionUsage } from "../../promotion/types/promotion.types";
import { CardRequest, NationCard } from "../carte-nation/types/carte-nation.types";
import { Address } from "./address.type";
import { Favorite } from "./favorite.types";

export enum LoyaltyPointIsUsed {
  YES = 'YES',
  NO = 'NO',
  PARTIAL = 'PARTIAL'
}

export enum LoyaltyPointType {
  EARNED = 'EARNED',
  REDEEMED = 'REDEEMED',
  EXPIRED = 'EXPIRED',
  BONUS = 'BONUS'
}
export enum LoyaltyLevel {
  STANDARD = 'STANDARD',
  PREMIUM = 'PREMIUM',
  GOLD = 'GOLD'
}

export interface Customer {
  id: string;
  phone: string;
  first_name: string | null;
  last_name: string | null;
  birth_day: string | null;
  email: string | null;
  image: string | null;
  loyalty_level: LoyaltyLevel | null;
  total_points: number;
  lifetime_points: number;
  last_level_update: string | null;
  // Relations
  addresses?: Address[];
  favorites?: Favorite[];
  orders?: Order[];
  notification_settings?: NotificationSetting;
  loyalty_points?: LoyaltyPoint[];
  promotion_usages?: PromotionUsage[];
  loyalty_level_history?: LoyaltyLevelHistory[];
  Comment?: Comment[];
  TicketMessage?: TicketMessage[];
  Message?: Message[];
  TicketThread?: TicketThread[];
  Conversation?: Conversation[];
  cardRequests?: CardRequest[];
  nationCards?: NationCard[];
  //   Voucher?: Voucher[];
  // Metadata
  entity_status: EntityStatus;
  created_at: string;
  updated_at: string;
  last_login_at: string | null;
}

export interface LoyaltyPoint {
  id: string;
  customer_id: string;
  is_used: LoyaltyPointIsUsed;
  points_used: number;
  points: number;
  type: LoyaltyPointType;
  reason?: string | null;
  order_id?: string | null;
  expires_at?: string | null;
  created_at: string;
  updated_at: string;

  // Relations 
  customer?: Customer;
  order?: Order;
}

export interface LoyaltyLevelHistory {
  id: string;
  customer_id: string;
  previous_level?: LoyaltyLevel | null;
  new_level: LoyaltyLevel;
  points_at_time: number;
  reason?: string | null;
  created_at: string;
  updated_at: string;

  // Relation
  customer?: Customer;
}

export interface NotificationSetting {
  customer_id: string;
  order: boolean;
  promotions: boolean;
  system: boolean;
  customer?: Customer;
}

export interface CustomerQuery {
  page?: number;
  limit?: number;
  status?: EntityStatus;
  search?: string;
  restaurantId?: string;
}