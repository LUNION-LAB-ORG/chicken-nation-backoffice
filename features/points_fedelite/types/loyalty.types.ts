import { Customer } from "../../customer/types/customer.types";
import { Order } from "../../orders/types/order.types";

export type LoyaltyPointType = "EARNED" | "REDEEMED" | "EXPIRED" | "BONUS";
export type LoyaltyLevel = "STANDARD" | "PREMIUM" | "GOLD";

export interface LoyaltyPoint {
    id: string;
    customer_id: string;
    points_used: number;
    points: number;
    type: LoyaltyPointType;
    reason: string | null;
    order_id: string | null;
    expires_at: string | null;
    created_at: string;
    updated_at: string;
    // Relations
    customer?: Customer;
    order?: Order;
}

export interface LoyaltyLevelHistory {
    id: string;
    customer_id: string;
    previous_level: LoyaltyLevel | null;
    new_level: LoyaltyLevel;
    points_at_time: number;
    reason: string | null;
    created_at: string;
    updated_at: string;
    // Relations
    customer?: Customer;
}

export interface LoyaltyConfig {
    id: string;
    points_per_xof: number;
    points_expiration_days: number | null;
    minimum_redemption_points: number;
    point_value_in_xof: number;
    standard_threshold: number;
    premium_threshold: number;
    gold_threshold: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface CustomerLoyaltyInfo {
    customer_id: string;
    total_points: number;
    available_points: number;
    used_points: number;
    expired_points: number;
    current_level: LoyaltyLevel;
    points_to_next_level: number | null;
    next_level: LoyaltyLevel | null;
    level_history: LoyaltyLevelHistory[];
    recent_transactions: LoyaltyPoint[];
}

export interface AvailablePointsBreakdown {
    total_available: number;
    by_type: {
        earned: number;
        bonus: number;
    };
    expiring_soon: {
        points: number;
        expires_at: string;
    }[];
}

export interface AddLoyaltyPointDto {
    customer_id: string;
    points: number;
    type: LoyaltyPointType;
    reason?: string;
    order_id?: string;
    expires_at?: string;
}

export interface RedeemPointsDto {
    customer_id: string;
    points: number;
    reason?: string;
}

export interface LoyaltyPointQuery {
    page?: number;
    limit?: number;
    customer_id?: string;
    type?: LoyaltyPointType;
    is_used?: "all" | "available" | "used" | "partial";
    search?: string;
}

export interface CalculatePointsResponse {
    points: number;
    amount: number;
}

export interface LoyaltyConfigFormData {
  points_per_xof: string;
  points_expiration_days: string;
  minimum_redemption_points: string;
  point_value_in_xof: string;
  standard_threshold: string;
  premium_threshold: string;
  gold_threshold: string;
  is_active: boolean;
}