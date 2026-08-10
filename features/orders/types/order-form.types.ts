import { DeliveryService, OrderType } from "./order.types";

// ✅ SUPPLÉMENT AVEC QUANTITÉ (même format que le mobile V2)
export interface SupplementItem {
    id: string;
    quantity: number;
}

// ✅ INTERFACES POUR LE FORMULAIRE DE COMMANDE
export interface OrderItemFormData {
    dish_id: string;
    quantity: number;
    supplements: SupplementItem[];
    epice: boolean;
    /**
     * MENUS COMPOSABLES : identifiants des choix retenus. Absent pour un plat
     * ordinaire. Ce tableau ne transporte JAMAIS de montant : le serveur
     * retrouve le prix dans sa base et vérifie les bornes du plat.
     */
    option_item_ids?: string[];
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
    /** Override admin : force FREE (Chicken Nation) ou TURBO (sous-traitant). Si absent, auto-détection backend. */
    delivery_service?: DeliveryService;
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
    // true si ce supplément est explicitement exclu du plat sélectionné
    // (modèle "tout par défaut − exclusions"). L'UI le grise et empêche l'ajout.
    excluded?: boolean;
}
