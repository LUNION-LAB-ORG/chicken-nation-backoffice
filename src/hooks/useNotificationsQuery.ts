import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
  InfiniteData,
} from "@tanstack/react-query";
import { NotificationAPI, Notification } from "@/services/notificationService";
import { useEffect, useMemo, useRef } from "react";
import { io } from "socket.io-client";
import { SOCKET_URL } from "../../socket";
import { usePendingOrdersSound } from "./usePendingOrdersSound";
import { User } from '@/types/auth';

interface UseNotificationsQueryProps {
  user: User;
  enabled: boolean;
}

interface NotificationPage {
  data: Notification[];
  meta: {
    limit: number;
    page: number;
    total: number;
    totalPages: number;
  };
}

interface UseNotificationsQueryReturn {
  notifications: Notification[];
  isLoading: boolean;
  isFetchingNextPage: boolean;
  hasNextPage: boolean | undefined;
  error: Error | null;
  fetchNextPage: () => void;
  refetch: () => void;
  markAsRead: (notificationId: string) => void;
  markAsUnread: (notificationId: string) => void;
  markAllAsRead: () => void;
  deleteNotification: (notificationId: string) => void;
  isMarkingAsRead: boolean;
  isMarkingAsUnread: boolean;
  isMarkingAllAsRead: boolean;
  isDeletingNotification: boolean;
}

export const useNotificationsQuery = ({
  user,
  enabled,
}: UseNotificationsQueryProps): UseNotificationsQueryReturn => {
  const queryClient = useQueryClient();
  const audioRef = useRef<HTMLAudioElement | null>(null); // Référence audio
  useEffect(() => {
    audioRef.current = new Audio("/musics/notification-sound.mp3");
    audioRef.current.load();

    return () => {
      audioRef.current = null;
    };
  }, []);

  // ✅ Hook pour le son continu des commandes en attente
  const { hasPendingOrders, isPlaying, pendingOrdersCount } =
    usePendingOrdersSound({
      activeFilter: "nouvelle", // Utiliser 'nouvelle' pour les commandes PENDING
      selectedRestaurant: user?.restaurant_id || undefined,
      disabledSound: false, // Toujours activé pour l'instant
    });

  // ✅ Query pour récupérer les notifications avec pagination infinie
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
    refetch,
  } = useInfiniteQuery<NotificationPage>({
    queryKey: ["notifications", user.id],
    queryFn: async ({ pageParam = 1 }) => {
      return NotificationAPI.getUserNotifications(user.id, {
        page: pageParam as number,
      });
    },
    initialPageParam: 1,
    getNextPageParam: (lastNotifications: NotificationPage) => {
      if (lastNotifications.meta.page < lastNotifications.meta.totalPages) {
        return lastNotifications.meta.page + 1;
      }
      return undefined;
    },
    enabled: enabled,
    staleTime: 30000,
    gcTime: 5 * 60 * 1000,
  });

  // ✅ Calcul des notifications à partir des pages
  const notifications = useMemo(
    () => data?.pages.flatMap((page) => page.data) || [],
    [data]
  );

  // ✅ Gestion des sockets
  useEffect(() => {
    const socket = io(SOCKET_URL, {
      query: {
        token: NotificationAPI.getToken(),
        type: "user",
      },
    });
    const handleNewNotification = () => {
      queryClient.invalidateQueries({
        queryKey: ["notifications", user.id],
      });
      queryClient.invalidateQueries({
        queryKey: ["notification-stats", user.id],
      });

      // Jouer le son de notification
      if (audioRef.current) {
        audioRef.current.currentTime = 0; // Réinitialiser la position
        audioRef.current.play().catch((error) => {
          console.error("Erreur de lecture audio", error);
        });
      }
    };

    socket.on("notification:new", handleNewNotification);

    return () => {
      socket.off("notification:new", handleNewNotification);
    };
  }, [queryClient, user]);

  // ✅ Mutation pour marquer comme lu (optimiste)
  const markAsReadMutation = useMutation({
    mutationFn: (notificationId: string) =>
      NotificationAPI.markAsRead(notificationId),
    onMutate: async (notificationId) => {
      await queryClient.cancelQueries({
        queryKey: ["notifications", user.id],
      });

      const previousNotifications = queryClient.getQueryData<
        InfiniteData<NotificationPage>
      >(["notifications", user.id]);

      if (previousNotifications) {
        queryClient.setQueryData<InfiniteData<NotificationPage>>(
          ["notifications", user.id],
          {
            ...previousNotifications,
            pages: previousNotifications.pages.map((page) => ({
              ...page,
              data: page.data.map((notification) =>
                notification.id === notificationId
                  ? { ...notification, is_read: true }
                  : notification
              ),
            })),
          }
        );
      }

      return { previousNotifications };
    },
    onError: (err, _, context) => {
      if (context?.previousNotifications) {
        queryClient.setQueryData(
          ["notifications", user.id],
          context.previousNotifications
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: ["notification-stats", user.id],
      });
    },
  });

  // ✅ Mutation pour marquer comme non lu (optimiste)

  const markAsUnreadMutation = useMutation({
    mutationFn: (notificationId: string) =>
      NotificationAPI.markAsUnread(notificationId),
    onMutate: async (notificationId) => {
      await queryClient.cancelQueries({
        queryKey: ["notifications", user.id],
      });

      const previousNotifications = queryClient.getQueryData<
        InfiniteData<NotificationPage>
      >(["notifications", user.id]);

      if (previousNotifications) {
        queryClient.setQueryData<InfiniteData<NotificationPage>>(
          ["notifications", user.id],
          {
            ...previousNotifications,
            pages: previousNotifications.pages.map((page) => ({
              ...page,
              data: page.data.map((notification) =>
                notification.id === notificationId
                  ? { ...notification, is_read: false }
                  : notification
              ),
            })),
          }
        );
      }

      return { previousNotifications };
    },
    onError: (err, _, context) => {
      if (context?.previousNotifications) {
        queryClient.setQueryData(
          ["notifications", user.id],
          context.previousNotifications
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: ["notification-stats", user.id],
      });
    },
  });

  // ✅ Mutation pour marquer toutes comme lues (optimiste)
  const markAllAsReadMutation = useMutation({
    mutationFn: () => NotificationAPI.markAllAsRead(user.id),
    onMutate: async () => {
      await queryClient.cancelQueries({
        queryKey: ["notifications", user.id],
      });

      const previousNotifications = queryClient.getQueryData<
        InfiniteData<NotificationPage>
      >(["notifications", user.id]);

      if (previousNotifications) {
        queryClient.setQueryData<InfiniteData<NotificationPage>>(
          ["notifications", user.id],
          {
            ...previousNotifications,
            pages: previousNotifications.pages.map((page) => ({
              ...page,
              data: page.data.map((notification) => ({
                ...notification,
                is_read: true,
              })),
            })),
          }
        );
      }

      return { previousNotifications };
    },
    onError: (err, _, context) => {
      if (context?.previousNotifications) {
        queryClient.setQueryData(
          ["notifications", user.id],
          context.previousNotifications
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: ["notification-stats", user.id],
      });
    },
  });

  // ✅ Mutation pour supprimer une notification (optimiste)
  const deleteNotificationMutation = useMutation({
    mutationFn: (notificationId: string) =>
      NotificationAPI.deleteNotification(notificationId),
    onMutate: async (notificationId) => {
      await queryClient.cancelQueries({
        queryKey: ["notifications", user.id],
      });

      const previousNotifications = queryClient.getQueryData<
        InfiniteData<NotificationPage>
      >(["notifications", user.id]);

      if (previousNotifications) {
        queryClient.setQueryData<InfiniteData<NotificationPage>>(
          ["notifications", user.id],
          {
            ...previousNotifications,
            pages: previousNotifications.pages.map((page) => ({
              ...page,
              data: page.data.filter(
                (notification) => notification.id !== notificationId
              ),
            })),
          }
        );
      }

      return { previousNotifications };
    },
    onError: (err, _, context) => {
      if (context?.previousNotifications) {
        queryClient.setQueryData(
          ["notifications", user.id],
          context.previousNotifications
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: ["notification-stats", user.id],
      });
    },
  });

  return {
    notifications,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    error: error as Error | null,
    fetchNextPage,
    refetch,
    markAsRead: markAsReadMutation.mutate,
    markAsUnread: markAsUnreadMutation.mutate,
    markAllAsRead: markAllAsReadMutation.mutate,
    deleteNotification: deleteNotificationMutation.mutate,
    isMarkingAsRead: markAsReadMutation.isPending,
    isMarkingAsUnread: markAsUnreadMutation.isPending,
    isMarkingAllAsRead: markAllAsReadMutation.isPending,
    isDeletingNotification: deleteNotificationMutation.isPending,
  };
};
