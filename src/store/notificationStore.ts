import { create } from "zustand";
import {
  NotificationAPI,
  Notification,
  NotificationStats,
} from "@/services/notificationService";

interface NotificationStore {
  // État
  notifications: Notification[];
  stats: NotificationStats | null;
  isLoading: boolean;
  error: string | null;
  // ✅ Pagination pour ADMIN
  currentPage: number;
  totalPages: number;
  hasMorePages: boolean;
  isLoadingMore: boolean;

  // Actions
  fetchNotifications: (userId: string, userRole?: string) => Promise<void>;
  loadMoreNotifications: (userId: string, userRole?: string) => Promise<void>;
  fetchStats: (userId: string) => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAsUnread: (notificationId: string) => Promise<void>;
  markAllAsRead: (userId: string) => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  deleteMultipleNotifications: (notificationIds: string[]) => Promise<void>;
  clearError: () => void;
  reset: () => void;
}

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  // État initial
  notifications: [],
  stats: null,
  isLoading: false,
  error: null,
  // ✅ État pagination
  currentPage: 1,
  totalPages: 1,
  hasMorePages: false,
  isLoadingMore: false,

  // Récupérer les notifications selon le rôle de l'utilisateur
  fetchNotifications: async (userId: string, userRole?: string) => {
    console.log(
      `[NotificationStore] Fetching notifications for userId: ${userId}, role: ${userRole}`
    );
    set({ isLoading: true, error: null, currentPage: 1 });
    try {
      let notifications: Notification[] = [];
      let totalPages = 1;
      let hasMorePages = false;

      if (userRole === "ADMIN") {
        // ADMIN : Utiliser l'endpoint global avec pagination
        console.log("[NotificationStore] Using ADMIN endpoint");
        const response = await NotificationAPI.getAllNotifications({
          limit: 20,
          page: 1,
        });
        notifications = response.data || [];
        totalPages = response.meta?.totalPages || 1;
        hasMorePages = response.meta?.page < response.meta?.totalPages;
        console.log(
          `[NotificationStore] ADMIN received ${notifications.length} notifications, page 1/${totalPages}`
        );
      } else {
        // Utilisateurs normaux : Utiliser l'endpoint spécifique
        console.log("[NotificationStore] Using user-specific endpoint");
        notifications = (await NotificationAPI.getUserNotifications(userId))
          .data;
        console.log(
          `[NotificationStore] User received ${notifications.length} notifications`
        );
      }

      set({
        notifications,
        isLoading: false,
        currentPage: 1,
        totalPages,
        hasMorePages,
      });
    } catch (error: unknown) {
      console.error(
        "[NotificationStore] Erreur lors de la récupération des notifications:",
        error
      );
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Erreur lors de la récupération des notifications";
      set({
        error: errorMessage,
        isLoading: false,
        notifications: [], // S'assurer qu'on a toujours un tableau
        currentPage: 1,
        totalPages: 1,
        hasMorePages: false,
      });
    }
  },

  // ✅ Charger plus de notifications (pour ADMIN)
  loadMoreNotifications: async (userId: string, userRole?: string) => {
    const { currentPage, totalPages, isLoadingMore } = get();

    if (isLoadingMore || currentPage >= totalPages || userRole !== "ADMIN") {
      return;
    }

    console.log(
      `[NotificationStore] Loading more notifications, page ${currentPage + 1}`
    );
    set({ isLoadingMore: true, error: null });

    try {
      const nextPage = currentPage + 1;
      const response = await NotificationAPI.getAllNotifications({
        limit: 20,
        page: nextPage,
      });
      const newNotifications = response.data || [];

      const { notifications: existingNotifications } = get();
      const allNotifications = [...existingNotifications, ...newNotifications];

      set({
        notifications: allNotifications,
        currentPage: nextPage,
        hasMorePages: nextPage < (response.meta?.totalPages || 1),
        isLoadingMore: false,
      });

      console.log(
        `[NotificationStore] Loaded ${newNotifications.length} more notifications, now ${allNotifications.length} total`
      );
    } catch (error: unknown) {
      console.error(
        "[NotificationStore] Erreur lors du chargement de plus de notifications:",
        error
      );
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Erreur lors du chargement de plus de notifications";
      set({
        error: errorMessage,
        isLoadingMore: false,
      });
    }
  },

  // Récupérer les statistiques
  fetchStats: async (userId: string) => {
    try {
      const stats = await NotificationAPI.getNotificationStats(userId);
      set({ stats });
    } catch (error: unknown) {
      console.error("Erreur lors de la récupération des statistiques:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Erreur lors de la récupération des statistiques";
      set({ error: errorMessage });
    }
  },

  // Marquer comme lu
  markAsRead: async (notificationId: string) => {
    try {
      await NotificationAPI.markAsRead(notificationId);

      // Mettre à jour l'état local
      const { notifications, stats } = get();
      const updatedNotifications = notifications.map((notification) =>
        notification.id === notificationId
          ? { ...notification, is_read: true }
          : notification
      );

      // Mettre à jour les stats
      const updatedStats = stats
        ? {
            ...stats,
            unread: Math.max(0, stats.unread - 1),
            read: stats.read + 1,
          }
        : null;

      set({
        notifications: updatedNotifications,
        stats: updatedStats,
      });
    } catch (error: unknown) {
      console.error("Erreur lors du marquage comme lu:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Erreur lors du marquage comme lu";
      set({ error: errorMessage });
    }
  },

  // Marquer comme non lu
  markAsUnread: async (notificationId: string) => {
    try {
      await NotificationAPI.markAsUnread(notificationId);

      // Mettre à jour l'état local
      const { notifications, stats } = get();
      const updatedNotifications = notifications.map((notification) =>
        notification.id === notificationId
          ? { ...notification, is_read: false }
          : notification
      );

      // Mettre à jour les stats
      const updatedStats = stats
        ? {
            ...stats,
            unread: stats.unread + 1,
            read: Math.max(0, stats.read - 1),
          }
        : null;

      set({
        notifications: updatedNotifications,
        stats: updatedStats,
      });
    } catch (error: unknown) {
      console.error("Erreur lors du marquage comme non lu:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Erreur lors du marquage comme non lu";
      set({ error: errorMessage });
    }
  },

  // Marquer toutes comme lues
  markAllAsRead: async (userId: string) => {
    try {
      await NotificationAPI.markAllAsRead(userId);

      // Mettre à jour l'état local
      const { notifications, stats } = get();
      const updatedNotifications = notifications.map((notification) => ({
        ...notification,
        is_read: true,
      }));

      // Mettre à jour les stats
      const updatedStats = stats
        ? {
            ...stats,
            unread: 0,
            read: stats.total,
          }
        : null;

      set({
        notifications: updatedNotifications,
        stats: updatedStats,
      });
    } catch (error: unknown) {
      console.error("Erreur lors du marquage de toutes comme lues:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Erreur lors du marquage de toutes comme lues";
      set({ error: errorMessage });
    }
  },

  // Supprimer une notification
  deleteNotification: async (notificationId: string) => {
    try {
      await NotificationAPI.deleteNotification(notificationId);

      // Mettre à jour l'état local
      const { notifications, stats } = get();
      const notificationToDelete = notifications.find(
        (n) => n.id === notificationId
      );
      const updatedNotifications = notifications.filter(
        (n) => n.id !== notificationId
      );

      // Mettre à jour les stats
      const updatedStats = stats
        ? {
            total: Math.max(0, stats.total - 1),
            unread:
              notificationToDelete && !notificationToDelete.is_read
                ? Math.max(0, stats.unread - 1)
                : stats.unread,
            read:
              notificationToDelete && notificationToDelete.is_read
                ? Math.max(0, stats.read - 1)
                : stats.read,
          }
        : null;

      set({
        notifications: updatedNotifications,
        stats: updatedStats,
      });
    } catch (error: unknown) {
      console.error("Erreur lors de la suppression:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Erreur lors de la suppression";
      set({ error: errorMessage });
    }
  },

  // Supprimer plusieurs notifications
  deleteMultipleNotifications: async (notificationIds: string[]) => {
    try {
      await NotificationAPI.deleteMultipleNotifications(notificationIds);

      // Mettre à jour l'état local
      const { notifications, stats } = get();
      const notificationsToDelete = notifications.filter((n) =>
        notificationIds.includes(n.id)
      );
      const updatedNotifications = notifications.filter(
        (n) => !notificationIds.includes(n.id)
      );

      // Calculer les changements de stats
      const deletedUnread = notificationsToDelete.filter(
        (n) => !n.is_read
      ).length;
      const deletedRead = notificationsToDelete.filter((n) => n.is_read).length;

      const updatedStats = stats
        ? {
            total: Math.max(0, stats.total - notificationIds.length),
            unread: Math.max(0, stats.unread - deletedUnread),
            read: Math.max(0, stats.read - deletedRead),
          }
        : null;

      set({
        notifications: updatedNotifications,
        stats: updatedStats,
      });
    } catch (error: unknown) {
      console.error("Erreur lors de la suppression multiple:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Erreur lors de la suppression multiple";
      set({ error: errorMessage });
    }
  },

  // Effacer l'erreur
  clearError: () => set({ error: null }),

  // Réinitialiser le store
  reset: () =>
    set({
      notifications: [],
      stats: null,
      isLoading: false,
      error: null,
      currentPage: 1,
      totalPages: 1,
      hasMorePages: false,
      isLoadingMore: false,
    }),
}));
