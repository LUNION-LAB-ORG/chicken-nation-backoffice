import { EntityStatus } from "../../../types"
import { OrderTable } from "../../orders/types/ordersTable.types"
import { CardRequest, NationCard } from "../../carte-nation/types/carte-nation.types"
import { LoyaltyLevel, LoyaltyPointType } from "../types/customer.types"

export type CustomerMapperStatus = "Nouveau" | "Active" | "Inactif" | "Supprimé"
export type LoyaltyPointTypeMapper = "Gagné" | "Utilisé" | "Expiré" | "Bonus"

export interface CustomerMapperData {
    id: string;
    fullName: string;
    email: string | null;
    phone: string;
    image: string | null;
    status: CustomerMapperStatus;
    memberSince: string;
    loyaltyLevel: LoyaltyLevel;
    stats: {
        totalOrders: number;
        totalSpent: number;
        loyaltyPoints: number;
        favorites: number;
    };
    recentOrders: Array<OrderTable>;
    loyaltyHistory: Array<{
        id: string;
        type: LoyaltyPointTypeMapper;
        points: number;
        reason: string;
        date: string;
    }>;
    favoriteDishes: Array<{
        id: string;
        name: string;
        category: string;
        price: number;
        image: string;
        addedDate: string;
    }>;
    reviews: Array<{
        id: string;
        rating: number;
        comment: string;
        date: string;
        dishName?: string;
        orderRef?: string;
    }>;
    addresses: Array<{
        id: string;
        title: string;
        fullAddress: string;
        city: string | null;
        latitude: number;
        longitude: number;
    }>;
    cardRequests?: CardRequest[];
    nationCards?: NationCard[];
}
export const CUSTOMER_STATUS_MAP: Record<EntityStatus, CustomerMapperStatus> = {
    "NEW": "Nouveau",
    'ACTIVE': "Active",
    "INACTIVE": "Inactif",
    "DELETED": "Supprimé",
}

export const CUSTOMER_LOYALTY_POINT_TYPE_MAP: Record<LoyaltyPointType, LoyaltyPointTypeMapper> = {
    [LoyaltyPointType.EARNED]: "Gagné",
    [LoyaltyPointType.REDEEMED]: "Utilisé",
    [LoyaltyPointType.EXPIRED]: "Expiré",
    [LoyaltyPointType.BONUS]: "Bonus",
}