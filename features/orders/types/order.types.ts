import { EntityStatus, SortOrder } from "../../../types";
import { Customer } from "../../customer/types/customer.types";
import { Dish } from "../../menus/types/dish.types";
import { Supplement } from "../../menus/types/supplement.types";
import { Restaurant } from "../../restaurants/types/restaurant.types";
import { Paiement } from "./paiement.types";

// ✅ ENUMS
export enum OrderStatus {
    PENDING = 'PENDING',
    CANCELLED = 'CANCELLED',
    ACCEPTED = 'ACCEPTED',
    IN_PROGRESS = 'IN_PROGRESS',
    READY = 'READY',
    PICKED_UP = 'PICKED_UP',
    COLLECTED = 'COLLECTED',
    COMPLETED = 'COMPLETED'
}
export enum DeliveryService {
    TURBO = 'TURBO',
    FREE = 'FREE'
}

export enum TypeTable {
    TABLE_SQUARE = 'TABLE_SQUARE',
    TABLE_RECTANGLE = 'TABLE_RECTANGLE',
    TABLE_ROUND = 'TABLE_ROUND'
}

export enum OrderType {
    DELIVERY = "DELIVERY",
    PICKUP = "PICKUP",
    TABLE = "TABLE",
}

// Structure pour le champ 'address' de Order (basé sur le commentaire)
export interface OrderAddress {
    title: string;
    address: string;
    street?: string;
    city?: string;
    longitude: number;
    latitude: number;
    note: string;
}

export interface Order {
    id: string;
    reference: string;
    customer_id: string;
    paied: boolean;
    delivery_fee: number;
    delivery_service: DeliveryService;
    zone_id: string | null;
    points: number;
    type: OrderType;
    table_type: TypeTable | null;
    places: number | null;
    address: string;
    code_promo: string | null;
    tax: number;
    amount: number;
    net_amount: number;
    discount: number;
    date: string | null;
    time: string | null;
    estimated_delivery_time: string | null;
    estimated_preparation_time: string | null;
    fullname: string | null;
    phone: string | null;
    email: string | null;
    note: string | null;
    auto: boolean;
    status: OrderStatus;
    restaurant_id: string;
    // Relations
    order_items?: OrderItem[];
    paiements?: Paiement[];
    customer?: Customer;
    restaurant?: Restaurant;
    promotion_id: string | null;
    //   promotion?: Promotion | null;
    //   promotion_usages?: PromotionUsage[];
    //   loyalty_points?: LoyaltyPoint[];
    //   Comment?: Comment[];
    //   TicketThread?: TicketThread[];
    //   Redemption?: Redemption[];
    // Metadata
    entity_status: EntityStatus;
    completed_at: string | null;
    paied_at: string | null;
    created_at: string;
    updated_at: string;
}

export interface OrderItem {
    id: string;
    quantity: number;
    amount: number;
    epice: boolean;
    order_id: string;
    dish_id: string;
    supplements: Supplement[] | null; // JSON
    cooking_time: number | null;
    // Relations
    dish?: Dish;
    order?: Order;
    // Metadata
    created_at: string;
    updated_at: string;
}

export interface DeliveryFee {
    montant: number;
    zone: string;
    distance: number;
    service: DeliveryService;
    zone_id: string | null;
}


export interface OrderQuery {
    status?: OrderStatus;
    type?: OrderType;
    customerId?: string;
    restaurantId?: string;
    startDate?: string;
    endDate?: string;
    minAmount?: number;
    maxAmount?: number;
    reference?: string;
    sortBy?: string;
    sortOrder?: SortOrder;
    page?: number;
    limit?: number;
}