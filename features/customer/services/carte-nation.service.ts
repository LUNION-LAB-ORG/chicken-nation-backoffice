import { getAuthToken } from "@/utils/authUtils";
import { getHumanReadableError } from '@/utils/errorMessages';
import { PaginatedResponse } from '../../../types';
import {
    CardRequest,
    CardRequestQuery,
    NationCard,
    NationCardQuery,
} from '../types/carte-nation.types';

const API_URL = process.env.NEXT_PUBLIC_API_PREFIX;
const BASE_URL = API_URL + '/admin/card-nation';

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

// --- Gestion des Demandes (Requests) ---

export const getAllRequests = async (query?: CardRequestQuery) => {
    try {
        const { url, headers } = await prepareRequest(BASE_URL, '/requests', query);
        const response = await fetch(url, { method: 'GET', headers });
        if (!response.ok) throw new Error(`Error: ${response.status}`);
        return await response.json() as PaginatedResponse<CardRequest>;
    } catch (error) {
        throw new Error(getHumanReadableError(error));
    }
};

export const getRequestById = async (id: string) => {
    try {
        const { url, headers } = await prepareRequest(BASE_URL, `/requests/${id}`);
        const response = await fetch(url, { method: 'GET', headers });
        if (!response.ok) throw new Error(`Error: ${response.status}`);
        return await response.json() as CardRequest;
    } catch (error) {
        throw new Error(getHumanReadableError(error));
    }
};

export const reviewRequest = async (id: string, data: { status: string; rejection_reason?: string }) => {
    try {
        const { url, headers } = await prepareRequest(BASE_URL, `/requests/${id}/review`);
        const response = await fetch(url, {
            method: 'PATCH',
            headers,
            body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error(`Error: ${response.status}`);
        return await response.json();
    } catch (error) {
        throw new Error(getHumanReadableError(error));
    }
};

// --- Gestion des Cartes (Cards) ---

export const getAllCards = async (query?: NationCardQuery) => {
    try {
        const { url, headers } = await prepareRequest(BASE_URL, '/cards', query);
        const response = await fetch(url, { method: 'GET', headers });
        if (!response.ok) throw new Error(`Error: ${response.status}`);
        return await response.json() as PaginatedResponse<NationCard>;
    } catch (error) {
        throw new Error(getHumanReadableError(error));
    }
};

export const getCardById = async (id: string) => {
    try {
        const { url, headers } = await prepareRequest(BASE_URL, `/cards/${id}`);
        const response = await fetch(url, { method: 'GET', headers });
        if (!response.ok) throw new Error(`Error: ${response.status}`);
        return await response.json() as NationCard;
    } catch (error) {
        throw new Error(getHumanReadableError(error));
    }
};

export const updateCardStatus = async (id: string, action: 'suspend' | 'revoke' | 'activate') => {
    try {
        const { url, headers } = await prepareRequest(BASE_URL, `/cards/${id}/${action}`);
        const response = await fetch(url, { method: 'PATCH', headers });
        if (!response.ok) throw new Error(`Error: ${response.status}`);
        return await response.json();
    } catch (error) {
        throw new Error(getHumanReadableError(error));
    }
};

// --- Export et Statistiques ---

export const exportCardsToExcel = async (query?: NationCardQuery) => {
    try {
        const { url, headers } = await prepareRequest(BASE_URL, '/cards/export/excel', query);
        const response = await fetch(url, { method: 'GET', headers });

        if (!response.ok) throw new Error('Download failed');

        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;

        // Extraction du nom de fichier depuis les headers si possible
        link.setAttribute('download', `export-cards-${new Date().getTime()}.xlsx`);
        document.body.appendChild(link);
        link.click();
        link.remove();
    } catch (error) {
        throw new Error(getHumanReadableError(error));
    }
};

export const getCardStats = async () => {
    try {
        const { url, headers } = await prepareRequest(BASE_URL, '/stats');
        const response = await fetch(url, { method: 'GET', headers });
        if (!response.ok) throw new Error(`Error: ${response.status}`);
        return await response.json();
    } catch (error) {
        throw new Error(getHumanReadableError(error));
    }
};