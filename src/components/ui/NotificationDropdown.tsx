"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { useAuthStore } from "@/store/authStore";
import { Notification } from "@/services/notificationService";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import NotificationModal from "./NotificationModal";
import { useNotificationsQuery } from "@/hooks/useNotificationsQuery";
import { useNotificationStatsQuery } from "@/hooks/useNotificationStatsQuery";

interface NotificationDropdownProps {
  className?: string;
}

const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
  className = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedNotification, setSelectedNotification] =
    useState<Notification | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { user } = useAuthStore();
  // ✅ Plus besoin de restaurantName - le backend gère le filtrage

  // ✅ TanStack Query pour les notifications
  const {
    notifications,
    // totalNotifications,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    error,
    fetchNextPage,
    markAsRead,
    markAsUnread,
    markAllAsRead,
    deleteNotification,
  } = useNotificationsQuery({
    user: user!,
    enabled: !!user?.id,
  });

  // ✅ TanStack Query pour les stats
  const { data: stats } = useNotificationStatsQuery({
    userId: user?.id || "",
    enabled: !!user?.id,
  });

  // Fermer le dropdown quand on clique à l'extérieur
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ✅ Filtrage côté client pour sécurité supplémentaire
  const filteredNotifications = useMemo(() => {
    if (!Array.isArray(notifications)) return [];

    // ✅ IMPORTANT : Exclure définitivement les notifications de type CUSTOMER
    return notifications.filter(
      (notification) => notification.target !== "CUSTOMER"
    );
  }, [notifications]);

  // ✅ Calculer le nombre de notifications non lues après filtrage
  const filteredUnreadCount = useMemo(() => {
    return filteredNotifications.filter((n) => !n.is_read).length;
  }, [filteredNotifications]);

  const handleNotificationClick = async (notification: Notification) => {
    setSelectedNotification(notification);
    setIsModalOpen(true);
    setIsOpen(false); // Fermer le dropdown
  };

  // Récupérer la notification live du store pour le modal
  const liveNotification = selectedNotification
    ? notifications.find((n) => n.id === selectedNotification.id) ||
      selectedNotification
    : null;

  const handleMarkAllAsRead = async () => {
    markAllAsRead();
  };

  // ✅ Charger plus de notifications (pour ADMIN)
  const handleLoadMore = async () => {
    fetchNextPage();
  };

  const handleDeleteNotification = async (
    notificationId: string,
    event: React.MouseEvent
  ) => {
    event.stopPropagation();
    await deleteNotification(notificationId);
  };

  const handleModalMarkAsRead = async (notificationId: string) => {
    await markAsRead(notificationId);
  };

  const handleModalMarkAsUnread = async (notificationId: string) => {
    await markAsUnread(notificationId);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedNotification(null);
  };

  const handleToggleNotificationRead = async (
    notification: Notification,
    event: React.MouseEvent
  ) => {
    event.stopPropagation();
    if (notification.is_read) {
      await markAsUnread(notification.id);
    } else {
      await markAsRead(notification.id);
    }
  };

  const getNotificationIcon = (type: Notification["type"]) => {
    switch (type.toUpperCase()) {
      case "ORDER":
        return "🛒";
      case "PAYMENT":
        return "💳";
      case "DELIVERY":
        return "🚚";
      case "PROMOTION":
        return "🎉";
      default:
        return "📢";
    }
  };

  const getNotificationColor = (type: Notification["type"]) => {
    switch (type.toUpperCase()) {
      case "ORDER":
        return "text-green-600";
      case "PAYMENT":
        return "text-blue-600";
      case "DELIVERY":
        return "text-orange-600";
      case "PROMOTION":
        return "text-purple-600";
      default:
        return "text-gray-600";
    }
  };

  const formatNotificationTime = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), {
        addSuffix: true,
        locale: fr,
      });
    } catch {
      return "Il y a quelques instants";
    }
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Bouton de notification */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-400 hover:text-gray-500 cursor-pointer focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 rounded-lg"
      >
        {/* Icône de notification */}
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>

        {/* Badge de notifications non lues (filtrées selon les permissions) */}
        {filteredUnreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {filteredUnreadCount > 99 ? "99+" : filteredUnreadCount}
          </span>
        )}
      </button>

      {/* Dropdown des notifications */}
      {isOpen && (
        <div className="absolute left-1/2 md:right-0 md:left-auto mt-2 w-[calc(100vw-1rem)] md:w-80 max-w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50 transform -translate-x-1/4 md:translate-x-0">
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900">
              Notifications
            </h3>
            {stats && stats.unread > 0 && (
              <button
                type="button"
                onClick={handleMarkAllAsRead}
                className="text-sm text-orange-600 hover:text-orange-700 font-medium"
              >
                Tout marquer comme lu
              </button>
            )}
          </div>

          {/* Contenu */}
          <div className="max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="p-4 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
                <p className="text-sm text-gray-500 mt-2">Chargement...</p>
              </div>
            ) : error ? (
              <div className="p-4 text-center">
                <p className="text-sm text-red-600">
                  {error.message || "Une erreur est survenue"}
                </p>
              </div>
            ) : !Array.isArray(filteredNotifications) ||
              filteredNotifications.length === 0 ? (
              <div className="p-4 text-center">
                <p className="text-sm text-gray-500">Aucune notification</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {filteredNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                      !notification.is_read ? "bg-orange-50" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-lg">
                            {getNotificationIcon(notification.type)}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p
                              className={`text-sm font-medium ${getNotificationColor(
                                notification.type
                              )}`}
                            >
                              {notification.title}
                            </p>
                          </div>
                          {!notification.is_read && (
                            <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {formatNotificationTime(notification.created_at)}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 ml-2">
                        {/* Bouton marquer comme lu/non lu */}
                        <button
                          type="button"
                          onClick={(e) =>
                            handleToggleNotificationRead(notification, e)
                          }
                          className={`p-1 rounded-full transition-colors ${
                            notification.is_read
                              ? "text-gray-400 hover:text-orange-500"
                              : "text-orange-500 hover:text-orange-600"
                          }`}
                          title={
                            notification.is_read
                              ? "Marquer comme non lue"
                              : "Marquer comme lue"
                          }
                        >
                          <svg
                            className="w-4 h-4"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                            <path
                              fillRule="evenodd"
                              d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </button>
                        {/* Bouton supprimer */}
                        <button
                          type="button"
                          onClick={(e) =>
                            handleDeleteNotification(notification.id, e)
                          }
                          className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                          title="Supprimer la notification"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {user?.role === "ADMIN" && hasNextPage && (
            <div className="px-4 py-3 border-t border-gray-200 text-center">
              <button
                type="button"
                onClick={handleLoadMore}
                disabled={isFetchingNextPage}
                className="text-sm text-orange-600 hover:text-orange-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isFetchingNextPage
                  ? "Chargement..."
                  : "Charger plus de notifications"}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Modal de détails */}
      <NotificationModal
        notification={liveNotification}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onMarkAsRead={handleModalMarkAsRead}
        onMarkAsUnread={handleModalMarkAsUnread}
      />
    </div>
  );
};

export default NotificationDropdown;
