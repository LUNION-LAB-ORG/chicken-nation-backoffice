import { getAuthToken } from '@/utils/authUtils';
import { getHumanReadableError } from '@/utils/errorMessages';
import { PaginatedResponse } from '../../../types';
import {
  CreatePromoCodeDto,
  PromoCode,
  PromoCodeQuery,
  PromoCodeStats,
  UpdatePromoCodeDto,
} from '../types/promo-code.types';

const API_URL = process.env.NEXT_PUBLIC_API_PREFIX;
const BASE_URL = API_URL + '/promo-code';

const prepareRequest = async <T>(baseUrl: string, endpoint: string, query?: T) => {
  const token = getAuthToken();
  if (!token) throw new Error('Authentication required');

  const params = new URLSearchParams();
  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value === undefined || value === null) return;
      if (Array.isArray(value)) {
        value.forEach((v) => params.append(key, String(v)));
      } else {
        params.append(key, String(value));
      }
    });
  }

  const url = `${baseUrl}${endpoint}${params.toString() ? `?${params.toString()}` : ''}`;
  const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  return { url, headers };
};

// --- Liste des codes promo ---

export const getPromoCodes = async (query?: PromoCodeQuery) => {
  try {
    const { url, headers } = await prepareRequest(BASE_URL, '', query);
    const response = await fetch(url, { method: 'GET', headers });
    if (!response.ok) throw new Error(`Error: ${response.status}`);
    return (await response.json()) as PaginatedResponse<PromoCode>;
  } catch (error) {
    throw new Error(getHumanReadableError(error));
  }
};

// --- Statistiques ---

export const getPromoCodeStats = async () => {
  try {
    const { url, headers } = await prepareRequest(BASE_URL, '/stats');
    const response = await fetch(url, { method: 'GET', headers });
    if (!response.ok) throw new Error(`Error: ${response.status}`);
    return (await response.json()) as PromoCodeStats;
  } catch (error) {
    throw new Error(getHumanReadableError(error));
  }
};

// --- Détail d'un code promo ---

export const getPromoCode = async (id: string) => {
  try {
    const { url, headers } = await prepareRequest(BASE_URL, `/${id}`);
    const response = await fetch(url, { method: 'GET', headers });
    if (!response.ok) throw new Error(`Error: ${response.status}`);
    return (await response.json()) as PromoCode;
  } catch (error) {
    throw new Error(getHumanReadableError(error));
  }
};

// --- Créer un code promo ---

export const createPromoCode = async (data: CreatePromoCodeDto) => {
  try {
    const { url, headers } = await prepareRequest(BASE_URL, '');
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Error: ${response.status}`);
    }
    return (await response.json()) as PromoCode;
  } catch (error) {
    throw new Error(getHumanReadableError(error));
  }
};

// --- Mettre à jour un code promo ---

export const updatePromoCode = async (id: string, data: UpdatePromoCodeDto) => {
  try {
    const { url, headers } = await prepareRequest(BASE_URL, `/${id}`);
    const response = await fetch(url, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Error: ${response.status}`);
    }
    return (await response.json()) as PromoCode;
  } catch (error) {
    throw new Error(getHumanReadableError(error));
  }
};

// --- Supprimer un code promo ---

export const deletePromoCode = async (id: string) => {
  try {
    const { url, headers } = await prepareRequest(BASE_URL, `/${id}`);
    const response = await fetch(url, { method: 'DELETE', headers });
    if (!response.ok) throw new Error(`Error: ${response.status}`);
    return (await response.json()) as PromoCode;
  } catch (error) {
    throw new Error(getHumanReadableError(error));
  }
};

// --- Toggle actif/inactif ---

export const togglePromoCode = async (id: string) => {
  try {
    const { url, headers } = await prepareRequest(BASE_URL, `/${id}/toggle`);
    const response = await fetch(url, { method: 'POST', headers });
    if (!response.ok) throw new Error(`Error: ${response.status}`);
    return (await response.json()) as PromoCode;
  } catch (error) {
    throw new Error(getHumanReadableError(error));
  }
};
