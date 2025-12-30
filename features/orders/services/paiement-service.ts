import { getAuthToken } from "@/utils/authUtils";
import { PaginatedResponse, SortOrder } from "../../../types";
import { PaiementFormData } from "../types/paiement-form.types";
import { Paiement, PaiementQuery } from "../types/paiement.types";

const API_URL = process.env.NEXT_PUBLIC_API_PREFIX;
const BASE_URL = API_URL + '/paiements';

// Fonction utilitaire pour construire et exécuter les requêtes
const prepareRequest = async <T>(baseUrl: string, endpoint: string, query?: T) => {
    const token = getAuthToken();

    if (!token) {
        throw new Error('Authentication required');
    }

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

    return {
        url,
        headers
    }

};

export async function getAllPaiements(params: PaiementQuery = {
    page: 1,
    limit: 10,
    sortBy: 'created_at',
    sortOrder: SortOrder.DESC
}): Promise<PaginatedResponse<Paiement>> {

    try {
        const { url, headers } = await prepareRequest(BASE_URL, '/', params);

        const response = await fetch(url, {
            method: 'GET',
            headers,
        });
        if (!response.ok) {
            if (response.status === 404) {
                return {
                    data: [], meta: {
                        total: 0,
                        page: 0,
                        limit: 0,
                        totalPages: 0
                    }
                };
            }
            const error = await response.json();
            throw new Error(error.message || `HTTP error! status: ${response.status}`);
        }
        return await response.json() as PaginatedResponse<Paiement>;
    } catch (error) {
        throw new Error(error.message);
    }
}

export async function getPaiementById(id: string): Promise<Paiement> {

    try {
        const { url, headers } = await prepareRequest(BASE_URL, `/${id}`);

        const response = await fetch(url, {
            method: 'GET',
            headers,
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || `HTTP error! status: ${response.status}`);
        }
        return await response.json() as Paiement;
    } catch (error) {
        throw new Error(error.message);
    }
}

export async function deletePaiement(id: string): Promise<void> {

    try {
        const { url, headers } = await prepareRequest(BASE_URL, `/${id}`);

        const response = await fetch(url, {
            method: 'DELETE',
            headers,
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || `HTTP error! status: ${response.status}`);
        }
    } catch (error) {
        throw new Error(error.message);
    }
}

export const addPaiement = async (formData: PaiementFormData) => {
    try {
        const { url, headers } = await prepareRequest(BASE_URL, '/add');

        const response = await fetch(url, {
            method: 'POST',
            headers,
            body: JSON.stringify(formData)
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || `HTTP error! status: ${response.status}`);
        }
        return await response.json() as {
            success: boolean,
            message: string,
        };
    } catch (error) {
        throw new Error(error.message);
    }
};
