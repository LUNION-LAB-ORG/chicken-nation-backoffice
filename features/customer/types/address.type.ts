import { Customer } from "./customer.types";

export interface Address {
    id: string;
    title: string;
    address: string;
    street: string | null;
    city: string | null;
    longitude: number;
    latitude: number;
    customer_id: string | null;
    // Relations
    customer?: Customer | null;
    // Metadata
    created_at: Date | string;
    updated_at: Date | string;
}