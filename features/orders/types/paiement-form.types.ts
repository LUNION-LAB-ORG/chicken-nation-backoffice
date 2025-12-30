import { PaiementMode } from "./paiement.types";

export interface PaiementFormData {
    items: {
        amount: number;
        mode: PaiementMode;
        source?: string;
        order_id?: string;
        client_id?: string;
    }[]
}