import { getAuthToken } from "@/utils/authUtils";
import { getHumanReadableError } from '@/utils/errorMessages';
import { Customer } from '../../customer/types/customer.types';
import { User } from '../../users/types/user.types';
import { Restaurant, RestaurantQuery } from '../types/restaurant.types';
import { PaginatedResponse } from "../../../types";

const API_URL = process.env.NEXT_PUBLIC_API_PREFIX;
const BASE_URL = API_URL + '/restaurants';

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

export const getAllRestaurants = async (query?: RestaurantQuery) => {
  try {
    const { url, headers } = await prepareRequest(BASE_URL, '/', query);

    const response = await fetch(url, {
      method: 'GET',
      headers
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json() as PaginatedResponse<Restaurant>;
  } catch (error) {
    console.error(error);
    const userMessage = getHumanReadableError(error);
    throw new Error(userMessage);
  }
};

export const getRestaurantById = async (id: string) => {
  try {
    const { url, headers } = await prepareRequest(BASE_URL, `/${id}`);

    const response = await fetch(url, {
      method: 'GET',
      headers
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json() as Restaurant;
  } catch (error) {
    console.error(error);
    const userMessage = getHumanReadableError(error);
    throw new Error(userMessage);
  }
};

export const getRestaurantManager = async (id: string) => {
  try {
    const { url, headers } = await prepareRequest(BASE_URL, `/${id}/manager`);

    const response = await fetch(url, {
      method: 'GET',
      headers
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json() as User;
  } catch (error) {
    console.error(error);
    const userMessage = getHumanReadableError(error);
    throw new Error(userMessage);
  }
};

export const getRestaurantUsers = async (id: string) => {
  try {
    const { url, headers } = await prepareRequest(BASE_URL, `/${id}/users`);

    const response = await fetch(url, {
      method: 'GET',
      headers
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json() as User[];
  } catch (error) {
    console.error(error);
    const userMessage = getHumanReadableError(error);
    throw new Error(userMessage);
  }
};


export const getRestaurantCustomers = async (id: string) => {
  try {
    const { url, headers } = await prepareRequest(BASE_URL, `/${id}/clients`);

    const response = await fetch(url, {
      method: 'GET',
      headers
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json() as Customer[];
  } catch (error) {
    console.error(error);
    const userMessage = getHumanReadableError(error);
    throw new Error(userMessage);
  }
};
