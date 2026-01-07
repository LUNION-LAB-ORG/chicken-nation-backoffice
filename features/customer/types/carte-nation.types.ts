import { Customer } from "./customer.types"


export type CardRequestStatus = "PENDING" | "IN_REVIEW" | "APPROVED" | "REJECTED" | "EXPIRED"

export type NationCardStatus = "ACTIVE" | "SUSPENDED" | "REVOKED"

export interface CardRequest {
    id: string
    customer_id: string
    nickname: string | null
    institution: string
    student_card_file_url: string
    status: CardRequestStatus
    rejection_reason: string | null
    reviewed_by: string | null
    reviewed_at: string | null
    created_at: string
    updated_at: string
    nation_card?: NationCard | null
    // Relations
    customer?: Customer
}

export interface NationCard {
    id: string
    customer_id: string
    card_request_id: string
    nickname: string | null
    card_number: string
    qr_code_value: string
    card_image_url: string
    status: NationCardStatus
    created_at: string
    updated_at: string
    // Relations
    card_request?: CardRequest
}

export interface CardRequestQuery {
    page?: number;
    limit?: number;
    search?: string;
    status?: CardRequestStatus;
    institution?: string;
}

export interface NationCardQuery {
    page?: number;
    limit?: number;
    search?: string;
    status?: NationCardStatus;
    institution?: string;
}