import { Dish } from "../../menus/types/dish.types";
import { Customer } from "./customer.types";

export interface Favorite {
    id: string;
    customer_id: string;
    dish_id: string;
    customer?: Customer;
    dish?: Dish;
    created_at: Date | string;
    updated_at: Date | string;
}