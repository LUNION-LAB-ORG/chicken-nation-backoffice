import { EntityStatus } from "../../../types";
import { DishRestaurant } from "../../menus/types/dish.types";
import { Order } from "../../orders/types/order.types";

export interface Restaurant {
    id: string;
    name: string;
    manager: string;
    description: string | null;
    image: string | null;
    address: string | null;
    latitude: number | null;
    longitude: number | null;
    phone: string | null;
    email: string | null;
    schedule: any | null; // JSON
    // Relations
    dish_restaurants?: DishRestaurant[];
    //   users?: User[];
    orders?: Order[];
    //   restaurantPromotions?: RestaurantPromotion[];
    //   Conversation?: Conversation[];
    // Metadata
    entity_status: EntityStatus;
    created_at: Date | string;
    updated_at: Date | string;
}


export interface RestaurantQuery {
    page?: number;
    limit?: number;
}