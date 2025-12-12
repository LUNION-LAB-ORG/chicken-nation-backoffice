import { getHumanReadableError } from '@/utils/errorMessages';
import { getAuthToken } from "@/utils/authUtils";
import { Customer, CustomerQuery } from '../types/customer.types';
import { PaginatedResponse } from '../../../types';
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