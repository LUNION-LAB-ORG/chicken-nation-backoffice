import { apiRequest } from './api';
import { getHumanReadableError, validateRestaurantError } from '@/utils/errorMessages';

// ✅ Interfaces adaptées pour le dashboard
export interface Comment {
  id: string;
  message: string;
  rating: number;
  order_id?: string;
  customer_id?: string;
  dish_id?: string;
  restaurant_id?: string;
  created_at?: string;
  updated_at?: string;
  customer?: {
    id: string;
    first_name: string;
    last_name: string;
    phone: string;
    email?: string;
    image?: string;
  };
  order?: {
    id: string;
    reference: string;
    created_at: string;
    total_amount?: number;
  };
  dish?: {
    id: string;
    name: string;
    image?: string;
  };
  restaurant?: {
    id: string;
    name: string;
  };
}

export interface DishCommentsResponse {
  dish_id: string;
  dish_name: string;
  total_comments: number;
  average_rating: number;
  comments: Comment[];
}

export interface RestaurantCommentsResponse {
  restaurant_id: string;
  restaurant_name: string;
  total_comments: number;
  average_rating: number;
  comments: Comment[];
}

export interface CreateCommentPayload {
  message: string;
  rating: number;
  order_id: string;
  dish_id?: string;
  restaurant_id?: string;
}

export interface UpdateCommentPayload {
  message: string;
  rating: number;
}

export interface CommentFilters {
  page?: number;
  limit?: number;
  min_rating?: number;
  max_rating?: number;
  restaurantId?: string;
}

// ✅ Interface pour la réponse réelle de l'API
interface ApiCommentsResponse {
  data: Comment[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// ✅ Interface normalisée pour le frontend
export interface PaginatedCommentsResponse {
  data: Comment[];
  meta: {
    totalItems: number;
    itemCount: number;
    itemsPerPage: number;
    totalPages: number;
    currentPage: number;
  };
}



/**
 * Service de gestion des commentaires pour le dashboard
 */
export class CommentService {
  
  /**
   * Récupère tous les commentaires avec pagination et filtres côté serveur
   */
  static async getAllComments(filters: CommentFilters = {}): Promise<PaginatedCommentsResponse> {
    try {
      // ✅ Récupérer le token depuis les cookies
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
        throw new Error('Token d\'authentification manquant');
      }

      // ✅ URL avec vraie pagination côté serveur
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://chicken.turbodeliveryapp.com';

      // Construire les paramètres de requête avec pagination
      const queryParams = new URLSearchParams();

      // ✅ Pagination côté serveur (10 par page)
      queryParams.append('limit', (filters.limit || 10).toString());
      queryParams.append('page', (filters.page || 1).toString());

      // ✅ Filtres côté serveur
      if (filters.min_rating) {
        queryParams.append('min_rating', filters.min_rating.toString());
      }
      if (filters.max_rating) {
        queryParams.append('max_rating', filters.max_rating.toString());
      }

      if (filters.restaurantId) {
        queryParams.append('restaurantId', filters.restaurantId);
      }

      const url = `${baseUrl}/api/v1/comments?${queryParams.toString()}`;

      // ✅ Appel direct avec fetch comme dans Postman
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      const apiResponse: ApiCommentsResponse = await response.json();

      // ✅ Convertir au format attendu par le frontend avec vraie pagination
      const normalizedResponse: PaginatedCommentsResponse = {
        data: apiResponse.data || [],
        meta: {
          totalItems: apiResponse.meta?.total || 0,
          itemCount: apiResponse.data?.length || 0,
          itemsPerPage: apiResponse.meta?.limit || 10, // ✅ Vraie pagination
          totalPages: apiResponse.meta?.totalPages || 1,
          currentPage: apiResponse.meta?.page || 1
        }
      };

      return normalizedResponse;
    } catch (error) {
      console.error('❌ [CommentService] Erreur lors du chargement des commentaires:', error);
      const userMessage = getHumanReadableError(error);
      throw new Error(userMessage);
    }
  }

  /**
   * Récupère les commentaires d'un client spécifique
   */
  static async getCommentsByCustomer(customerId: string, filters: CommentFilters = {}): Promise<Comment[]> {
    try {
      const queryParams = new URLSearchParams();

      if (filters.page) queryParams.append('page', filters.page.toString());
      if (filters.limit) queryParams.append('limit', filters.limit.toString());
      if (filters.min_rating) queryParams.append('min_rating', filters.min_rating.toString());
      if (filters.max_rating) queryParams.append('max_rating', filters.max_rating.toString());

      const endpoint = `/comments/customer/${customerId}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await apiRequest<{comments: Comment[], total: number, page: number, limit: number}>(endpoint, 'GET');

      // ✅ Extraire le tableau comments de la réponse
      return response.comments || [];
    } catch (error) {
      const userMessage = getHumanReadableError(error);
      throw new Error(userMessage);
    }
  }

  /**
   * Récupère les commentaires d'un plat spécifique
   */
  static async getCommentsByDish(dishId: string): Promise<DishCommentsResponse> {
    try {
      const response = await apiRequest<DishCommentsResponse>(`/comments/dish/${dishId}`, 'GET');
      return response;
    } catch (error) {
      const userMessage = getHumanReadableError(error);
      throw new Error(userMessage);
    }
  }

  /**
   * Récupère les commentaires d'un restaurant spécifique
   */
  static async getCommentsByRestaurant(restaurantId: string): Promise<RestaurantCommentsResponse> {
    try {
      const response = await apiRequest<RestaurantCommentsResponse>(`/comments/restaurant/${restaurantId}`, 'GET');
      return response;
    } catch (error) {
      const userMessage = getHumanReadableError(error);
      throw new Error(userMessage);
    }
  }

  /**
   * Récupère les commentaires d'une commande spécifique
   */
  static async getCommentsByOrder(orderId: string): Promise<Comment[]> {
    try {
      const response = await apiRequest<Comment[]>(`/comments/order/${orderId}`, 'GET');
      return response;
    } catch (error) {
      const userMessage = getHumanReadableError(error);
      throw new Error(userMessage);
    }
  }

  /**
   * Récupère un commentaire par son ID
   */
  static async getCommentById(id: string): Promise<Comment> {
    try {
      const response = await apiRequest<Comment>(`/comments/${id}`, 'GET');
      return response;
    } catch (error) {
      const userMessage = getHumanReadableError(error);
      throw new Error(userMessage);
    }
  }

  /**
   * Crée un nouveau commentaire (pour les tests ou cas spéciaux)
   */
  static async createComment(payload: CreateCommentPayload): Promise<Comment> {
    try {
      const response = await apiRequest<Comment>('/comments', 'POST', payload);
      return response;
    } catch (error) {
      const userMessage = validateRestaurantError(error, 'create');
      throw new Error(userMessage);
    }
  }

  /**
   * Met à jour un commentaire existant
   */
  static async updateComment(id: string, payload: UpdateCommentPayload): Promise<Comment> {
    try {
      const response = await apiRequest<Comment>(`/comments/${id}`, 'PUT', payload);
      return response;
    } catch (error) {
      const userMessage = validateRestaurantError(error, 'update');
      throw new Error(userMessage);
    }
  }

  /**
   * Supprime un commentaire
   */
  static async deleteComment(id: string, customerId?: string): Promise<void> {
    try {
      const params = customerId ? { customerId } : undefined;
      await apiRequest<void>(`/comments/${id}`, 'DELETE', params);
    } catch (error) {
      const userMessage = validateRestaurantError(error, 'delete');
      throw new Error(userMessage);
    }
  }


}

// ✅ Exports pour compatibilité
export const {
  getAllComments,
  getCommentsByCustomer,
  getCommentsByDish,
  getCommentsByRestaurant,
  getCommentsByOrder,
  getCommentById,
  createComment,
  updateComment,
  deleteComment
} = CommentService;
