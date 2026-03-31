import { getAuthToken } from "@/utils/authUtils";
import { getHumanReadableError } from '@/utils/errorMessages';
import { PaginatedResponse } from '../../../types';
import {
    CreateVoucherDto,
    Redemption,
    UpdateVoucherDto,
    Voucher,
    VoucherQuery,
} from '../types/voucher.types';

const API_URL = process.env.NEXT_PUBLIC_API_PREFIX;
const BASE_URL = API_URL + '/voucher';

const prepareRequest = async <T>(baseUrl: string, endpoint: string, query?: T) => {
    const token = getAuthToken();
    if (!token) throw new Error('Authentication required');

    const params = new URLSearchParams();
    if (query) {
        Object.entries(query).forEach(([key, value]) => {
            if (value === undefined || value === null) return;
            if (Array.isArray(value)) {
                value.forEach(v => params.append(key, String(v)));
            } else {
                params.append(key, String(value));
            }
        });
    }

    const url = `${baseUrl}${endpoint}${params.toString() ? `?${params.toString()}` : ''}`;
    const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    };

    return { url, headers };
};

// --- Liste des bons ---

export const getAllVouchers = async (query?: VoucherQuery) => {
    try {
        const { url, headers } = await prepareRequest(BASE_URL, '', query);
        const response = await fetch(url, { method: 'GET', headers });
        if (!response.ok) throw new Error(`Error: ${response.status}`);
        return await response.json() as PaginatedResponse<Voucher>;
    } catch (error) {
        throw new Error(getHumanReadableError(error));
    }
};

// --- Détail d'un bon ---

export const getVoucherByCode = async (code: string) => {
    try {
        const { url, headers } = await prepareRequest(BASE_URL, `/${code}`);
        const response = await fetch(url, { method: 'GET', headers });
        if (!response.ok) throw new Error(`Error: ${response.status}`);
        return await response.json() as Voucher;
    } catch (error) {
        throw new Error(getHumanReadableError(error));
    }
};

// --- Historique des utilisations ---

export const getVoucherRedemptions = async (code: string) => {
    try {
        const { url, headers } = await prepareRequest(BASE_URL, `/${code}/redemptions`);
        const response = await fetch(url, { method: 'GET', headers });
        if (!response.ok) throw new Error(`Error: ${response.status}`);
        return await response.json() as Redemption[];
    } catch (error) {
        throw new Error(getHumanReadableError(error));
    }
};

// --- Création d'un bon ---

export const createVoucher = async (data: CreateVoucherDto) => {
    try {
        const { url, headers } = await prepareRequest(BASE_URL, '');
        const response = await fetch(url, {
            method: 'POST',
            headers,
            body: JSON.stringify(data)
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || `Error: ${response.status}`);
        }
        return await response.json() as Voucher;
    } catch (error) {
        throw new Error(getHumanReadableError(error));
    }
};

// --- Mise à jour d'un bon ---

export const updateVoucher = async (code: string, data: UpdateVoucherDto) => {
    try {
        const { url, headers } = await prepareRequest(BASE_URL, `/${code}`);
        const response = await fetch(url, {
            method: 'PATCH',
            headers,
            body: JSON.stringify(data)
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || `Error: ${response.status}`);
        }
        return await response.json() as Voucher;
    } catch (error) {
        throw new Error(getHumanReadableError(error));
    }
};

// --- Annulation d'un bon ---

export const cancelVoucher = async (code: string) => {
    try {
        const { url, headers } = await prepareRequest(BASE_URL, `/${code}/cancel`);
        const response = await fetch(url, { method: 'POST', headers });
        if (!response.ok) throw new Error(`Error: ${response.status}`);
        return await response.json() as Voucher;
    } catch (error) {
        throw new Error(getHumanReadableError(error));
    }
};

// --- Suppression (soft delete) ---

export const removeVoucher = async (code: string) => {
    try {
        const { url, headers } = await prepareRequest(BASE_URL, `/${code}`);
        const response = await fetch(url, { method: 'DELETE', headers });
        if (!response.ok) throw new Error(`Error: ${response.status}`);
        return await response.json();
    } catch (error) {
        throw new Error(getHumanReadableError(error));
    }
};

// --- Restauration ---

export const restoreVoucher = async (code: string) => {
    try {
        const { url, headers } = await prepareRequest(BASE_URL, `/${code}/restore`);
        const response = await fetch(url, { method: 'POST', headers });
        if (!response.ok) throw new Error(`Error: ${response.status}`);
        return await response.json() as Voucher;
    } catch (error) {
        throw new Error(getHumanReadableError(error));
    }
};
