import { getAuthToken } from "@/utils/authUtils";
import { getHumanReadableError } from "@/utils/errorMessages";
import { Dish } from "../types/dish.types";

const API_URL = process.env.NEXT_PUBLIC_API_PREFIX;
const BASE_URL = API_URL + '/dishes';

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

export const getAllDishes = async () => {
  try {
    const { url, headers } = await prepareRequest(BASE_URL, '/get-all');

    const response = await fetch(url, {
      method: 'GET',
      headers
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json() as Dish[];
  } catch (error) {
    console.error(error);
    const userMessage = getHumanReadableError(error);
    throw new Error(userMessage);
  }
};