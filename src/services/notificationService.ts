import { apiRequest } from "./api";

/**
 * Interface pour les notifications
 */
export interface Notification {
  id: string;
  title: string;
  message: string;
  type: string; // 'ORDER', etc.
  is_read: boolean;
  user_id: string;
  target: string; // 'USER', 'CUSTOMER'
  icon?: string;
  icon_bg_color?: string;
  show_chevron?: boolean;
  data?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

/**
 * Interface pour les statistiques de notifications
 */
export interface NotificationStats {
  total: number;
  unread: number;
  read: number;
}

/**
 * Interface pour la réponse API des notifications
 */
interface NotificationResponse {
  data: Notification[];
  meta: {
    limit: number;
    page: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Service API pour la gestion des notifications
 */
export class NotificationAPI {
  /**
   * Récupère les notifications d'un utilisateur spécifique
   * @param userId - ID de l'utilisateur
   * @returns Promise<Notification[]>
   */

  // Récupérer le token
  static getToken() {
    if (typeof document === "undefined") return null;
    const cookies = document.cookie.split(";");
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split("=");
      if (name === "chicken-nation-token") {
        return decodeURIComponent(value);
      }
    }
    return null;
  }

  static async getUserNotifications(
    userId: string,
    filters?: {
      page?: number;
      limit?: number;
      type?: string;
      isRead?: boolean;
      target?: string;
    }
  ): Promise<NotificationResponse> {
    const queryParams = new URLSearchParams();
    if (filters?.page) queryParams.append("page", filters.page.toString());
    if (filters?.limit) queryParams.append("limit", filters.limit.toString());
    if (filters?.type) queryParams.append("type", filters.type);
    if (filters?.isRead !== undefined)
      queryParams.append("isRead", filters.isRead.toString());
    if (filters?.target) queryParams.append("target", filters.target);

    const endpoint = `/notifications/user/${userId}/USER${
      queryParams.toString() ? `?${queryParams.toString()}` : ""
    }`;

    try {
      console.log(`[NotificationAPI] Calling endpoint: ${endpoint}`);

      // ✅ Utiliser directement fetch pour plus de contrôle
      const baseUrl =
        process.env.NEXT_PUBLIC_API_URL ||
        "https://chicken.turbodeliveryapp.com";
      const fullUrl = `${baseUrl}/api/v1${endpoint}`;

      const token = NotificationAPI.getToken();
      if (!token) {
        console.error("[NotificationAPI] No auth token found");
        return {
          data: [],
          meta: { limit: 0, page: 1, total: 0, totalPages: 0 },
        };
      }

      console.log(`[NotificationAPI] Making request to: ${fullUrl}`);

      const response = await fetch(fullUrl, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });

      console.log(`[NotificationAPI] Response status: ${response.status}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          `[NotificationAPI] HTTP Error ${response.status}:`,
          errorText
        );
        return {
          data: [],
          meta: { limit: 0, page: 1, total: 0, totalPages: 0 },
        };
      }

      const data = await response.json();
      console.log(`[NotificationAPI] Response data:`, data);

      return data;
    } catch (error) {
      console.error(
        `[NotificationAPI] getUserNotifications - Error for userId ${userId}:`,
        error
      );
      return { data: [], meta: { limit: 0, page: 1, total: 0, totalPages: 0 } }; // Retourner un tableau vide au lieu de throw en cas d'erreur
    }
  }

  /**
   * Récupère toutes les notifications (pour ADMIN) avec pagination et filtres
   * ⚠️ IMPORTANT : Utiliser target='USER' pour exclure les notifications CUSTOMER (app mobile)
   * @param filters - Filtres optionnels (page, limit, userId, target, etc.)
   * @returns Promise<NotificationResponse>
   */
  static async getAllNotifications(
    filters: {
      page?: number;
      limit?: number;
      userId?: string;
      type?: string;
      is_read?: boolean;
      target?: string;
    } = {}
  ): Promise<NotificationResponse> {
    const queryParams = new URLSearchParams();

    if (filters.page) queryParams.append("page", filters.page.toString());
    if (filters.limit) queryParams.append("limit", filters.limit.toString());
    if (filters.userId) queryParams.append("userId", filters.userId);
    if (filters.type) queryParams.append("type", filters.type);
    if (filters.is_read !== undefined)
      queryParams.append("is_read", filters.is_read.toString());
    if (filters.target) queryParams.append("target", filters.target);

    const endpoint = `/notifications${
      queryParams.toString() ? `?${queryParams.toString()}` : ""
    }`;

    try {
      const response = await apiRequest<NotificationResponse>(endpoint, "GET");
      return response;
    } catch (error) {
      // ✅ SÉCURITÉ : Gestion gracieuse des erreurs CORS en développement
      if (
        error instanceof TypeError &&
        error.message.includes("Failed to fetch")
      ) {
        console.warn(
          `[NotificationAPI] CORS/Network error - returning empty notifications for development`
        );
        return {
          data: [],
          meta: { limit: 10, page: 1, total: 0, totalPages: 0 },
        };
      }
      console.error(`[NotificationAPI] getAllNotifications - Error:`, error);
      return {
        data: [],
        meta: { limit: 10, page: 1, total: 0, totalPages: 0 },
      };
    }
  }

  /**
   * Récupère une notification spécifique
   * @param notificationId - ID de la notification
   * @returns Promise<Notification>
   */
  static async getNotificationById(
    notificationId: string
  ): Promise<Notification> {
    const endpoint = `/notifications/${notificationId}`;

    try {
      const response = await apiRequest<Notification>(endpoint, "GET");
      return response;
    } catch (error) {
      console.error(`[NotificationAPI] getNotificationById - Error:`, error);
      throw error;
    }
  }

  /**
   * Récupère les statistiques de notifications d'un utilisateur
   * @param userId - ID de l'utilisateur
   * @returns Promise<NotificationStats>
   */
  static async getNotificationStats(
    userId: string
  ): Promise<NotificationStats> {
    const endpoint = `/notifications/stats/${userId}/USER`;

    try {
      const response = await apiRequest<NotificationStats>(endpoint, "GET");
      return response;
    } catch (error) {
      // ✅ SÉCURITÉ : Gestion gracieuse des erreurs CORS en développement
      if (
        error instanceof TypeError &&
        error.message.includes("Failed to fetch")
      ) {
        console.warn(
          `[NotificationAPI] CORS/Network error - returning default stats for development`
        );
        return { total: 0, unread: 0, read: 0 };
      }
      console.error(`[NotificationAPI] getNotificationStats - Error:`, error);
      return { total: 0, unread: 0, read: 0 }; // Retourner des stats par défaut
    }
  }

  /**
   * Marque une notification comme lue
   * @param notificationId - ID de la notification
   * @returns Promise<void>
   */
  static async markAsRead(notificationId: string): Promise<void> {
    const endpoint = `/notifications/${notificationId}/read`;

    try {
      await apiRequest<void>(endpoint, "PATCH");
    } catch (error) {
      console.error(`[NotificationAPI] markAsRead - Error:`, error);
      throw error;
    }
  }

  /**
   * Marque une notification comme non lue
   * @param notificationId - ID de la notification
   * @returns Promise<void>
   */
  static async markAsUnread(notificationId: string): Promise<void> {
    const endpoint = `/notifications/${notificationId}/unread`;

    try {
      await apiRequest<void>(endpoint, "PATCH");
    } catch (error) {
      console.error(`[NotificationAPI] markAsUnread - Error:`, error);
      throw error;
    }
  }

  /**
   * Marque toutes les notifications comme lues
   * @param userId - ID de l'utilisateur
   * @returns Promise<void>
   */
  static async markAllAsRead(userId: string): Promise<void> {
    const endpoint = `/notifications/user/${userId}/USER/read-all`;

    try {
      await apiRequest<void>(endpoint, "PATCH");
    } catch (error) {
      console.error(`[NotificationAPI] markAllAsRead - Error:`, error);
      throw error;
    }
  }

  /**
   * Supprime une notification
   * @param notificationId - ID de la notification
   * @returns Promise<void>
   */
  static async deleteNotification(notificationId: string): Promise<void> {
    const endpoint = `/notifications/${notificationId}`;

    try {
      await apiRequest<void>(endpoint, "DELETE");
    } catch (error) {
      console.error(`[NotificationAPI] deleteNotification - Error:`, error);
      throw error;
    }
  }

  /**
   * Supprime plusieurs notifications
   * @param notificationIds - IDs des notifications à supprimer
   * @returns Promise<void>
   */
  static async deleteMultipleNotifications(
    notificationIds: string[]
  ): Promise<void> {
    try {
      const deletePromises = notificationIds.map((id) =>
        this.deleteNotification(id)
      );
      await Promise.all(deletePromises);
    } catch (error) {
      console.error(
        `[NotificationAPI] deleteMultipleNotifications - Error:`,
        error
      );
      throw error;
    }
  }
}

export default NotificationAPI;
