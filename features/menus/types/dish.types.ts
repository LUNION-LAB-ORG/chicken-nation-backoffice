import { EntityStatus } from "../../../types";
import { Favorite } from "../../customer/types/favorite.types";
import { OrderItem } from "../../orders/types/order.types";
import { PromotionDish, PromotionTargetedDish } from "../../promotion/types/promotion.types";
import { Restaurant } from "../../restaurants/types/restaurant.types";
import { Category } from "./category.types";
import { Supplement } from "./supplement.types";

export interface Dish {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image: string | null;
  is_promotion: boolean;
  is_alway_epice: boolean;
  promotion_price: number | null;
  category_id: string;
  cooking_time: number | null;
  // Relations
  category?: Category;
  dish_restaurants?: DishRestaurant[];
  dish_supplements?: DishSupplement[];
  favorites?: Favorite[];
  order_items?: OrderItem[];
  promotion_dishes?: PromotionDish[];
  promotion_targeted_dishes?: PromotionTargetedDish[];
  // Metadata
  entity_status: EntityStatus;
  created_at: Date | string;
  updated_at: Date | string;
}

export interface DishRestaurant {
  id: string;
  dish_id: string;
  restaurant_id: string;
  dish?: Dish;
  restaurant?: Restaurant;
}

export interface DishSupplement {
  id: string;
  dish_id: string;
  supplement_id: string;
  dish?: Dish;
  supplement?: Supplement;
}