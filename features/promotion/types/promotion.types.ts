import { Customer } from "../../customer/types/customer.types";
import { Category } from "../../menus/types/category.types";
import { Dish } from "../../menus/types/dish.types";
import { Order } from "../../orders/types/order.types";
import { Restaurant } from "../../restaurants/types/restaurant.types";

export enum PromotionStatus {
    DRAFT = 'DRAFT',
    ACTIVE = 'ACTIVE',
    EXPIRED = 'EXPIRED',
    PAUSED = 'PAUSED',
    CANCELLED = 'CANCELLED'
}

export enum Visibility {
    PUBLIC = 'PUBLIC',
    PRIVATE = 'PRIVATE'
}

export enum DiscountType {
    PERCENTAGE = 'PERCENTAGE',
    FIXED_AMOUNT = 'FIXED_AMOUNT',
    BUY_X_GET_Y = 'BUY_X_GET_Y'
}

export enum TargetType {
    ALL_PRODUCTS = 'ALL_PRODUCTS',
    SPECIFIC_PRODUCTS = 'SPECIFIC_PRODUCTS',
    CATEGORIES = 'CATEGORIES'
}


export interface Promotion {
    id: string;
    title: string;
    description?: string | null;
    discount_type: DiscountType;
    discount_value: number;
    target_type: TargetType;

    // Contraintes
    min_order_amount?: number | null;
    max_discount_amount?: number | null;
    max_usage_per_user?: number | null;
    max_total_usage?: number | null;
    current_usage: number;

    // Dates
    start_date: string;
    expiration_date: string;

    // Statut et visibilité
    status: PromotionStatus;
    visibility: Visibility;

    // Ciblage fidélité
    target_standard: boolean;
    target_premium: boolean;
    target_gold: boolean;

    // Design
    coupon_image_url?: string | null;
    background_color?: string | null;
    text_color?: string | null;
    expiration_color?: string | null;

    // Métadonnées & Relations
    created_by_id: string;
    created_at: string;
    updated_at: string;

    // Relations optionnelles
    promotion_dishes?: PromotionDish[];
    promotion_targeted_dishes?: PromotionTargetedDish[];
    promotion_usages?: PromotionUsage[];
    promotion_targeted_categories?: PromotionTargetedCategory[];
    restaurantPromotions?: RestaurantPromotion[];
}

export interface RestaurantPromotion {
    id: string;
    promotion_id: string;
    restaurant_id: string;
    promotion?: Promotion;
    restaurant?: Restaurant;
}

export interface PromotionDish {
    id: string;
    promotion_id: string;
    dish_id: string;
    quantity: number;
    promotion?: Promotion;
    dish?: Dish;
}

export interface PromotionTargetedDish {
    id: string;
    promotion_id: string;
    dish_id: string;
    promotion?: Promotion;
    dish?: Dish;
}

export interface PromotionUsage {
    id: string;
    promotion_id: string;
    customer_id: string;
    order_id?: string | null;
    discount_amount: number;
    original_amount: number;
    final_amount: number;
    created_at: string;
    updated_at: string;
    promotion?: Promotion;
    customer?: Customer;
    order?: Order;
}

export interface PromotionTargetedCategory {
    id: string;
    promotion_id: string;
    category_id: string;
    promotion?: Promotion;
    category?: Category;
}