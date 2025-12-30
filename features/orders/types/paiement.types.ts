import { EntityStatus, SortOrder } from "../../../types";
import { Order } from "./order.types";

export enum PaiementMode {
    MOBILE_MONEY = 'MOBILE_MONEY',
    WALLET = 'WALLET',
    CARD = 'CARD',
    CASH = 'CASH'
}
export enum PaiementStatus {
    REVERTED = 'REVERTED',
    SUCCESS = 'SUCCESS',
    FAILED = 'FAILED'
}


export interface Paiement {
    id: string;
    amount: number;
    total: number;
    mode: PaiementMode;
    source: string | null;
    fees: number;
    client: any | null; // JSON
    client_id: string | null;
    status: PaiementStatus;
    reference: string;
    failure_code: string | null;
    failure_message: string | null;
    order_id: string | null;
    // Relations
    order?: Order | null;
    // Metadata
    entity_status: EntityStatus;
    created_at: string;
    updated_at: string;
}

export interface PaiementQuery {
    status?: PaiementStatus;
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