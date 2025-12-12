import { EntityStatus } from "../../../types";
import { Address } from "./address.type";
import { Favorite } from "./favorite.types";

export interface Customer {
  id: string;
  phone: string;
  first_name: string | null;
  last_name: string | null;
  birth_day: Date | string | null;
  email: string | null;
  image: string | null;
  // Relations
  addresses?: Address[];
  favorites?: Favorite[];
  //   orders?: Order[];
  //   notification_settings?: NotificationSetting;
  //   loyalty_level: LoyaltyLevel | null;
  total_points: number;
  lifetime_points: number;
  last_level_update: Date | string | null;
  //   loyalty_points?: LoyaltyPoint[];
  //   promotion_usages?: PromotionUsage[];
  //   loyalty_level_history?: LoyaltyLevelHistory[];
  //   Comment?: Comment[];
  //   TicketMessage?: TicketMessage[];
  //   Message?: Message[];
  //   TicketThread?: TicketThread[];
  //   Conversation?: Conversation[];
  //   Voucher?: Voucher[];
  // Metadata
  entity_status: EntityStatus;
  created_at: Date | string;
  updated_at: Date | string;
  last_login_at: Date | string | null;
}

export interface CustomerQuery {
  page?: number;
  limit?: number;
  status?: EntityStatus;
  search?: string;
  restaurantId?: string;
}