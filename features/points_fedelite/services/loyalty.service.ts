import { getAuthToken } from "@/utils/authUtils";
import { getHumanReadableError } from '@/utils/errorMessages';
import { PaginatedResponse } from '../../../types';
import {
    AddLoyaltyPointDto,
    AvailablePointsBreakdown,
    CalculatePointsResponse,
    CustomerLoyaltyInfo,
    LoyaltyConfig,
    LoyaltyConfigFormData,
    LoyaltyPoint,
    LoyaltyPointQuery,
    RedeemPointsDto,
} from '../types/loyalty.types';

const API_URL = process.env.NEXT_PUBLIC_API_PREFIX;
const BASE_URL = API_URL + '/fidelity/loyalty';

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

// --- Configuration ---

export const getConfig = async () => {
    try {
        const { url, headers } = await prepareRequest(BASE_URL, '/config');
        const response = await fetch(url, { method: 'GET', headers });
        if (!response.ok) throw new Error(`Error: ${response.status}`);
        return await response.json() as LoyaltyConfig;
    } catch (error) {
        throw new Error(getHumanReadableError(error));
    }
};
export const AddUpdateConfig = async (config: LoyaltyConfigFormData) => {
    try {
        const { url, headers } = await prepareRequest(BASE_URL, '/config');
        const response = await fetch(url, { method: 'POST', headers, body: JSON.stringify(config) });
        if (!response.ok) throw new Error(`Error: ${response.status}`);
        return await response.json() as LoyaltyConfig;
    } catch (error) {
        throw new Error(getHumanReadableError(error));
    }
};

// --- Informations client ---

export const getCustomerLoyaltyInfo = async (customerId: string) => {
    try {
        const { url, headers } = await prepareRequest(BASE_URL, `/customer/${customerId}`);
        const response = await fetch(url, { method: 'GET', headers });
        if (!response.ok) throw new Error(`Error: ${response.status}`);
        return await response.json() as CustomerLoyaltyInfo;
    } catch (error) {
        throw new Error(getHumanReadableError(error));
    }
};

export const getAvailablePointsBreakdown = async (customerId: string) => {
    try {
        const { url, headers } = await prepareRequest(BASE_URL, `/customer/${customerId}/points/breakdown`);
        const response = await fetch(url, { method: 'GET', headers });
        if (!response.ok) throw new Error(`Error: ${response.status}`);
        return await response.json() as AvailablePointsBreakdown;
    } catch (error) {
        throw new Error(getHumanReadableError(error));
    }
};

// --- Gestion des points ---

export const addPoints = async (data: AddLoyaltyPointDto) => {
    try {
        const { url, headers } = await prepareRequest(BASE_URL, '/points/add');
        const response = await fetch(url, {
            method: 'POST',
            headers,
            body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error(`Error: ${response.status}`);
        return await response.json();
    } catch (error) {
        throw new Error(getHumanReadableError(error));
    }
};

export const redeemPoints = async (data: RedeemPointsDto) => {
    try {
        const { url, headers } = await prepareRequest(BASE_URL, '/points/redeem');
        const response = await fetch(url, {
            method: 'POST',
            headers,
            body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error(`Error: ${response.status}`);
        return await response.json();
    } catch (error) {
        throw new Error(getHumanReadableError(error));
    }
};

export const calculatePointsForOrder = async (amount: number) => {
    try {
        const { url, headers } = await prepareRequest(BASE_URL, '/points/calculate', { amount });
        const response = await fetch(url, { method: 'GET', headers });
        if (!response.ok) throw new Error(`Error: ${response.status}`);
        return await response.json() as CalculatePointsResponse;
    } catch (error) {
        throw new Error(getHumanReadableError(error));
    }
};

export const calculateAmountForPoints = async (points: number) => {
    try {
        const { url, headers } = await prepareRequest(BASE_URL, '/points/calculate-amount', { points });
        const response = await fetch(url, { method: 'GET', headers });
        if (!response.ok) throw new Error(`Error: ${response.status}`);
        return await response.json() as CalculatePointsResponse;
    } catch (error) {
        throw new Error(getHumanReadableError(error));
    }
};

export const expirePoints = async () => {
    try {
        const { url, headers } = await prepareRequest(BASE_URL, '/points/expire');
        const response = await fetch(url, { method: 'POST', headers });
        if (!response.ok) throw new Error(`Error: ${response.status}`);
        return await response.json();
    } catch (error) {
        throw new Error(getHumanReadableError(error));
    }
};

// --- Liste des points (optionnel, si vous voulez afficher l'historique) ---

export const getAllLoyaltyPoints = async (query?: LoyaltyPointQuery) => {
    try {
        const { url, headers } = await prepareRequest(BASE_URL, '/points', query);
        const response = await fetch(url, { method: 'GET', headers });
        if (!response.ok) throw new Error(`Error: ${response.status}`);
        return await response.json() as PaginatedResponse<LoyaltyPoint>;
    } catch (error) {
        throw new Error(getHumanReadableError(error));
    }
};