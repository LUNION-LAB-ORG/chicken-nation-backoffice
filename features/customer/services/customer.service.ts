import { getHumanReadableError } from '@/utils/errorMessages';
import { getAuthToken } from "@/utils/authUtils";
import { Customer, CustomerQuery } from '../types/customer.types';
import { PaginatedResponse } from '../../../types';
import { clientAuNumero, numeroCanonique, rechercheDuNumero } from '../../orders/utils/client-commande';
import { CustomerAddForm } from '../types/customer-form.types';

const API_URL = process.env.NEXT_PUBLIC_API_PREFIX;
const BASE_URL = API_URL + '/customer';

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

export const getAllCustomers = async (query?: CustomerQuery) => {
    try {
        const { url, headers } = await prepareRequest(BASE_URL, '/', query);

        const response = await fetch(url, {
            method: 'GET',
            headers
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json() as PaginatedResponse<Customer>;
    } catch (error) {
        console.error(error);
        const userMessage = getHumanReadableError(error);
        throw new Error(userMessage);
    }
};

/**
 * Client qui porte exactement ce numéro, ou `null` (27/11) : le formulaire de
 * commande s'en sert pour rattacher la commande au client connu au lieu de
 * tenter d'en créer un second, que le serveur refuserait.
 */
export const trouverClientParTelephone = async (telephone: string): Promise<Customer | null> => {
    const canonique = numeroCanonique(telephone);
    if (!canonique) return null;
    const page = await getAllCustomers({ page: 1, limit: 10, search: rechercheDuNumero(canonique) });
    return clientAuNumero(page.data, canonique);
};

/**
 * Export Excel des clients selon les filtres COURANTS (segment/onglet + recherche
 * + restaurant). Récupère le fichier généré par le backend et déclenche le
 * téléchargement. Ne renvoie rien — c'est un effet de bord navigateur.
 */
export const exportCustomers = async (query?: CustomerQuery) => {
    const { url, headers } = await prepareRequest(BASE_URL, '/export', query);
    const response = await fetch(url, { method: 'GET', headers });
    if (!response.ok) {
        throw new Error(`Export impossible (HTTP ${response.status})`);
    }
    const blob = await response.blob();
    const href = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = href;
    const today = new Date().toISOString().split('T')[0];
    a.download = `clients-${today}.xlsx`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(href);
};

export const getCustomerById = async (id: string) => {
    try {
        const { url, headers } = await prepareRequest(BASE_URL, `/${id}`);

        const response = await fetch(url, {
            method: 'GET',
            headers
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json() as Customer;
    } catch (error) {
        console.error(error);
        const userMessage = getHumanReadableError(error);
        throw new Error(userMessage);
    }
};


export const deleteCustomer = async (id: string) => {
    try {
        const { url, headers } = await prepareRequest(BASE_URL, `/admin/${id}`);

        const response = await fetch(url, {
            method: 'DELETE',
            headers
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || `HTTP error! status: ${response.status}`);
        }
        return await response.json() as Customer;
    } catch (error) {
        throw new Error(error.message);
    }
};

export interface CustomerUpdatePayload {
    first_name?: string;
    last_name?: string;
    email?: string;
    phone?: string;
}

// Modification des infos d'un client par un agent backoffice (admin)
export const updateCustomer = async (id: string, payload: CustomerUpdatePayload) => {
    try {
        const { url, headers } = await prepareRequest(BASE_URL, `/admin/${id}`);

        const response = await fetch(url, {
            method: 'PATCH',
            headers,
            body: JSON.stringify(payload)
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || `HTTP error! status: ${response.status}`);
        }
        return await response.json() as Customer;
    } catch (error) {
        throw new Error(error.message);
    }
};

export const addCustomer = async (formData: CustomerAddForm) => {
    try {
        const { url, headers } = await prepareRequest(BASE_URL, '/');

        const response = await fetch(url, {
            method: 'POST',
            headers,
            body: JSON.stringify(formData)
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || `HTTP error! status: ${response.status}`);
        }
        return await response.json() as Customer;
    } catch (error) {
        throw new Error(error.message);
    }
};