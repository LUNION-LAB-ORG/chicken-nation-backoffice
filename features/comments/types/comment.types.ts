import { EntityStatus } from "../../../types";
import { Customer } from "../../customer/types/customer.types";
import { Order } from "../../orders/types/order.types";


export interface Comment {
    id: string;
    message: string;
    rating: number;
    customer_id: string;
    order_id: string;
    entity_status: EntityStatus;
    created_at: string;
    updated_at: string;

    // Relations 
    customer?: Customer;
    order?: Order;
}