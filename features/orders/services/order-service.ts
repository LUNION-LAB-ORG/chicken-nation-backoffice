import { getAuthToken } from "@/utils/authUtils";
import { OrderFormData } from '../types/order-form.types';
import { DeliveryFee, Order } from "../types/order.types";

const API_URL = process.env.NEXT_PUBLIC_API_PREFIX;
const BASE_URL = API_URL + '/orders';

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


export const addOrder = async (formData: OrderFormData) => {
    try {
        const { url, headers } = await prepareRequest(BASE_URL, '/create');

        const response = await fetch(url, {
            method: 'POST',
            headers,
            body: JSON.stringify(formData)
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || `HTTP error! status: ${response.status}`);
        }
        return await response.json() as Order;
    } catch (error) {
        throw new Error(error.message);
    }
};

export const getDeliveryFee = async (query?: { lat: number, long: number, restaurant_id?: string }) => {
    try {
        const { url, headers } = await prepareRequest(BASE_URL, '/frais-livraison', query);

        const response = await fetch(url, {
            method: 'GET',
            headers,
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || `HTTP error! status: ${response.status}`);
        }
        return await response.json() as DeliveryFee;
    } catch (error) {
        throw new Error(error.message);
    }
};