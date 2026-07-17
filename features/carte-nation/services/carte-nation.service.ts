import { getAuthToken } from "@/utils/authUtils";
import { getHumanReadableError } from '@/utils/errorMessages';
import { PaginatedResponse } from '../../../types';
import {
    CardLevel,
    CardRequest,
    CardRequestQuery,
    CardVisual,
    NationCard,
    NationCardQuery,
    PreviewCardBody,
    PreviewCardResponse,
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

export const reviewRequest = async (
    id: string,
    data: {
        status: string;
        rejection_reason?: string;
        /** Couleur de la carte émise (axe 1). */
        level?: CardLevel;
        /** Marqueur étudiant, indépendant du niveau (axe 2). */
        is_student?: boolean;
    },
    /** Photo RECADRÉE par le staff avant génération (optionnelle). */
    photo?: File,
) => {
    try {
        const { url, headers } = await prepareRequest(BASE_URL, `/requests/${id}/review`);

        // Avec photo → multipart (le navigateur pose le boundary, donc on retire le
        // Content-Type JSON). Sans photo → JSON comme avant : le backend accepte les deux.
        if (photo) {
            const { 'Content-Type': _json, ...authHeaders } = headers as Record<string, string>;
            const formData = new FormData();
            formData.append('status', data.status);
            if (data.rejection_reason) formData.append('rejection_reason', data.rejection_reason);
            if (data.level) formData.append('level', data.level);
            if (data.is_student !== undefined) {
                formData.append('is_student', String(data.is_student));
            }
            formData.append('photo', photo);

            const response = await fetch(url, {
                method: 'PATCH',
                headers: authHeaders,
                body: formData,
            });
            if (!response.ok) throw new Error(`Error: ${response.status}`);
            return await response.json();
        }

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

/** ⚠️ Suppression DÉFINITIVE d'une demande (+ sa carte si déjà générée). */
export const deleteRequest = async (id: string) => {
    try {
        const { url, headers } = await prepareRequest(BASE_URL, `/requests/${id}`);
        const response = await fetch(url, { method: 'DELETE', headers });
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

/**
 * Régénère le visuel d'une carte avec un type imposé par le staff.
 * Numéro de carte et QR conservés ; seule l'image (+ niveau/étudiant) change.
 */
export const regenerateCard = async (id: string, visual: CardVisual) => {
    try {
        const { url, headers } = await prepareRequest(BASE_URL, `/cards/${id}/regenerate`);
        const response = await fetch(url, {
            method: 'PATCH',
            headers,
            body: JSON.stringify(visual),
        });
        if (!response.ok) throw new Error(`Error: ${response.status}`);
        return await response.json();
    } catch (error) {
        throw new Error(getHumanReadableError(error));
    }
};

/** ⚠️ Suppression DÉFINITIVE d'une carte (+ son image S3). Préférer `revoke` si réversible. */
export const deleteCard = async (id: string) => {
    try {
        const { url, headers } = await prepareRequest(BASE_URL, `/cards/${id}`);
        const response = await fetch(url, { method: 'DELETE', headers });
        if (!response.ok) throw new Error(`Error: ${response.status}`);
        return await response.json();
    } catch (error) {
        throw new Error(getHumanReadableError(error));
    }
};

/**
 * Aperçu d'un design de carte (galerie / testeur). Le backend rend l'image avec le
 * VRAI générateur en render-only : renvoie un data-URL, ne crée aucun fichier S3.
 */
export const previewCard = async (data: PreviewCardBody, photo?: File) => {
    try {
        const { url, headers } = await prepareRequest(BASE_URL, '/preview-card');
        // multipart : la photo de test part en fichier (en base64 dans du JSON elle
        // dépasserait la limite de body). On RETIRE le Content-Type JSON pour que le
        // navigateur pose lui-même le boundary multipart.
        const { 'Content-Type': _json, ...authHeaders } = headers as Record<string, string>;

        const formData = new FormData();
        formData.append('level', data.level);
        formData.append('is_student', String(data.is_student ?? false));
        if (data.first_name) formData.append('first_name', data.first_name);
        if (data.last_name) formData.append('last_name', data.last_name);
        if (data.nickname) formData.append('nickname', data.nickname);
        if (photo) formData.append('photo', photo);

        const response = await fetch(url, {
            method: 'POST',
            headers: authHeaders,
            body: formData,
        });
        if (!response.ok) throw new Error(`Error: ${response.status}`);
        return await response.json() as PreviewCardResponse;
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