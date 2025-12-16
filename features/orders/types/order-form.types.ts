import { OrderType } from "./order.types";

// ✅ INTERFACES POUR LE FORMULAIRE DE COMMANDE
export interface OrderItemFormData {
    dish_id: string;
    quantity: number;
    supplements_ids: string[];
    epice: boolean;
}

export interface OrderFormData {
    type: OrderType;
    address: string;
    date?: string;
    time?: string;
    fullname?: string;
    phone?: string;
    email?: string;
    note?: string;
    items: OrderItemFormData[];
    customer_id?: string;
    restaurant_id?: string;
    auto: boolean;
    user_id: string;
    delivery_fee?: number;
}

// ✅ TYPES POUR LES OPTIONS
export interface DishOption {
    value: string;
    label: string;
    image?: string;
    price: string;
    category: string;
    supplements?: SupplementOption[];
    is_alway_epice?: boolean;
}

export interface SupplementOption {
    value: string;
    label: string;
    image?: string;
    price: number;
    type: string;
}
