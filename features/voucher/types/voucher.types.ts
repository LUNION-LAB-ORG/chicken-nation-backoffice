export type VoucherStatus = 'ACTIVE' | 'REDEEMED' | 'EXPIRED' | 'CANCELLED';

export interface VoucherCustomer {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phone: string;
}

export interface VoucherCreator {
    id: string;
    email: string;
    fullName: string;
}

export interface Voucher {
    id: string;
    code: string;
    initialAmount: number;
    remainingAmount: number;
    customer: VoucherCustomer;
    status: VoucherStatus;
    expiresAt: string | null;
    createdBy: VoucherCreator;
    createdAt: string;
    updatedAt: string;
    entityStatus: string;
}

export interface VoucherQuery {
    page?: number;
    limit?: number;
    status?: VoucherStatus;
    customer?: string;
    minAmount?: number;
    maxAmount?: number;
    startDate?: string;
    endDate?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    search?: string;
}

export interface CreateVoucherDto {
    initialAmount: number;
    customerId: string;
    expiresAt?: string;
}

export interface UpdateVoucherDto {
    initialAmount?: number;
    customerId?: string;
    expiresAt?: string;
    status?: VoucherStatus;
}

export interface Redemption {
    id: string;
    amount: number;
    orderId: string | null;
    createdAt: string;
    order?: {
        id: string;
        orderNumber: string;
        totalAmount: number;
    };
}
