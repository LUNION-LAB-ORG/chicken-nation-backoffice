import { api } from './api';
import {Dish} from '@/types/dish';

// Réexporter le type Dish pour l'utilisation dans d'autres modules
export type { Dish };
 
const DISHES_ENDPOINT = '/supplements';

export const createDish = async (formData: FormData): Promise<Dish> => {
  // Récupérer le token depuis les cookies
  const getCookieValue = (name: string): string | null => {
    if (typeof document === 'undefined') return null;
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const [cookieName, value] = cookie.trim().split('=');
      if (cookieName === name) {
        return decodeURIComponent(value);
      }
    }
    return null;
  };

  const token = getCookieValue('chicken-nation-token');

  if (!token) {
    throw new Error('Authentication required');
  }

  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  try {
     console.log('Contenu du FormData envoyé:');
    for (const pair of formData.entries()) {
      console.log(`${pair[0]}: ${pair[1]}`);
    }

    const response = await fetch(`${API_URL}/api/v1/supplements`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Erreur détaillée:', errorText);
      throw new Error(`Erreur ${response.status}: ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Erreur complète:', error);
    throw error;
  }
};

// Interface pour les paramètres de requête avec pagination
export interface DishQuery {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  available?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Récupère tous les plats (version simple)
 */
export interface DishesResponse {
  data: Dish[];
  total?: number;
  page?: number;
  limit?: number;
}

// Interface pour la réponse paginée
export interface PaginatedDishResponse {
  data: Dish[];
  meta: {
    totalItems: number;
    itemCount: number;
    itemsPerPage: number;
    totalPages: number;
    currentPage: number;
  };
}

export const getAllDishes = async (): Promise<DishesResponse> => {
  try {
    const API_URL = process.env.NEXT_PUBLIC_API_URL;

    const response = await fetch(`${API_URL}/api/v1/supplements`, {
      method: 'GET'
    });

    if (!response.ok) {
      throw new Error(`Erreur ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Erreur:', error);
    throw error;
  }
};

/**
 * Récupère les plats avec pagination
 */
export const getDishes = async (params: DishQuery = {}): Promise<PaginatedDishResponse> => {
  try {
    const { page = 1, limit = 10, search, category, available, sortBy, sortOrder } = params;

    // Construire les paramètres de requête
    const queryParams = new URLSearchParams({
      page: String(page),
      limit: String(limit)
    });

    if (search) queryParams.append('search', search);
    if (category) queryParams.append('category', category);
    if (available !== undefined) queryParams.append('available', String(available));
    if (sortBy) queryParams.append('sortBy', sortBy);
    if (sortOrder) queryParams.append('sortOrder', sortOrder);

    const API_URL = process.env.NEXT_PUBLIC_API_URL;
    const url = `${API_URL}/api/v1/supplements?${queryParams}`;

    const response = await fetch(url, {
      method: 'GET'
    });

    if (!response.ok) {
      throw new Error(`Erreur ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Erreur lors de la récupération des plats paginés:', error);
    throw error;
  }
};


export const getDishById = async (id: string): Promise<Dish> => {
  try {
    const response = await api.get<Dish>(`${DISHES_ENDPOINT}/${id}`);
    return response;
  } catch (error) {
    console.error(`Erreur lors de la récupération du plat ${id}:`, error);
    throw error;
  }
};


export const updateDish = async (id: string, data: Partial<Dish>): Promise<Dish> => {
  try {
    const response = await api.patch<Dish>(`${DISHES_ENDPOINT}/${id}`, data);
    return response;
  } catch (error) {
    console.error(`Erreur lors de la mise à jour du plat ${id}:`, error);
    throw error;
  }
};

export interface SupplementUpdateResponse {
  id: string;
  available: boolean;
  updated_at: string;
}

export const updateSupplementAvailability = async (id: string, available: boolean): Promise<SupplementUpdateResponse> => {
  try {
    // Utiliser le client API qui gère automatiquement l'authentification et le refresh token
    return await api.patch(`/supplements/${id}`, { available });
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la disponibilité:', error);
    throw error;
  }
};

export const deleteDish = async (id: string): Promise<void> => {
  try {
    await api.delete(`${DISHES_ENDPOINT}/${id}`);
  } catch (error) {
    console.error(`Erreur lors de la suppression du plat ${id}:`, error);
    throw error;
  }
};


export const deleteSupplement = async (id: string): Promise<void> => {
  try {
    const API_URL = process.env.NEXT_PUBLIC_API_URL;
    // Récupérer le token depuis les cookies
    const getCookieValue = (name: string): string | null => {
      if (typeof document === 'undefined') return null;
      const cookies = document.cookie.split(';');
      for (const cookie of cookies) {
        const [cookieName, value] = cookie.trim().split('=');
        if (cookieName === name) {
          return decodeURIComponent(value);
        }
      }
      return null;
    };

    const token = getCookieValue('chicken-nation-token');

    if (!token) {
      throw new Error('Authentication required');
    }

    const response = await fetch(`${API_URL}/api/v1/supplements/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Erreur détaillée:', errorText);
      throw new Error(`Erreur ${response.status}: ${errorText}`);
    }
  } catch (error) {
    console.error('Erreur lors de la suppression du supplément:', error);
    throw error;
  }
};
