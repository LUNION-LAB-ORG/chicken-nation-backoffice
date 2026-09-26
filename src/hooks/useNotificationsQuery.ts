import { acquireSocket, releaseSocket, shouldPlayOnce } from '../../features/messagerie/hooks/sharedSocket';
import { CORPS_MESSAGE_SUPPRIME } from '../../features/messagerie/utils/citation-locale';
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
  InfiniteData,
} from "@tanstack/react-query";
import { NotificationAPI, Notification } from "@/services/notificationService";
import { useEffect, useMemo, useRef, useState } from "react";
import { io } from "socket.io-client";
import { SOCKET_URL } from "@/config";

interface UseNotificationsQueryProps {
  userId: string;
  restaurantId: string;
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
  socketConnected: boolean;
}

export const useNotificationsQuery = ({
  userId,
  restaurantId,
  enabled,
}: UseNotificationsQueryProps): UseNotificationsQueryReturn => {
  const queryClient = useQueryClient();
  const audioRef = useRef<HTMLAudioElement | null>(null); // Référence audio
  const [connected, setConnected] = useState(false);
  useEffect(() => {
    audioRef.current = new Audio("/musics/notification-sound.mp3");
    audioRef.current.load();

    return () => {
      audioRef.current = null;
    };
  }, []);

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
    queryKey: ["notifications", userId],
    queryFn: async ({ pageParam = 1 }) => {
      return NotificationAPI.getUserNotifications(userId, {
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


  const handleNewNotification = (notification?: { data?: { kind?: unknown; messageId?: unknown } | null }) => {
    queryClient.invalidateQueries({
      queryKey: ["notifications", userId],
    });
    queryClient.invalidateQueries({
      queryKey: ["notification-stats", userId],
    });

    /**
     * Mention ou réponse : JAMAIS le son de la cloche.
     *
     * Le message lui-même sonne déjà à son arrivée : la personne mentionnée
     * est membre de la conversation, elle reçoit `new:message`, et l'écouteur
     * posé sur toute la gestion (`useMessagesSound`) sonne pour chaque message
     * d'un collègue, sur tous les onglets. Se contenter d'éviter le doublon
     * avec la clé `msg:<id>` ne suffisait pas : cet écouteur-là ne pose pas la
     * clé, et, hors de la messagerie, la mention sonnait deux fois.
     *
     * La clé est tout de même posée, pour que la messagerie ouverte ne rejoue
     * pas le son si la notification arrive avant le message.
     */
    const donnees = notification?.data;
    if (
      (donnees?.kind === "mention" || donnees?.kind === "reponse") &&
      typeof donnees.messageId === "string"
    ) {
      shouldPlayOnce(`msg:${donnees.messageId}`);
      return;
    }

    // Jouer le son de notification
    if (audioRef.current) {
      audioRef.current.currentTime = 0; // Réinitialiser la position
      audioRef.current.play().catch((error) => {
        console.error("Erreur de lecture audio", error);
      });
    }
  };

  /**
   * Le SERVEUR a marqué des notifications comme lues de lui-même : ouvrir une
   * conversation interne vaut lecture de ses mentions et réponses. Il l'annonce
   * par `notification:bulk_read`. Sans cette écoute, la cloche restait
   * allumée jusqu'au rechargement de la page, pour un message déjà sous les
   * yeux. On relit la liste et le compteur, sans son.
   */
  const handleLectureGroupee = () => {
    queryClient.invalidateQueries({
      queryKey: ["notifications", userId],
    });
    queryClient.invalidateQueries({
      queryKey: ["notification-stats", userId],
    });
  };

  /**
   * Un message a été RETIRÉ : les notifications de mention ou de réponse qui
   * en montraient un extrait sont retouchées tout de suite dans la cloche.
   *
   * Le serveur remplace aussi leur texte en base, mais sans prévenir la cloche,
   * et en parallèle de cet évènement : relire la liste pourrait encore rendre
   * l'ancien texte. On remplace donc localement, seulement pour les
   * notifications qui portent CE message.
   */
  const handleMessageSupprime = (charge?: { message?: { id?: unknown } | null } | null) => {
    const messageId = charge?.message?.id;
    if (typeof messageId !== "string" || !messageId) return;
    queryClient.setQueryData<InfiniteData<NotificationPage>>(
      ["notifications", userId],
      (ancien) => {
        if (!ancien?.pages) return ancien;
        let change = false;
        const pages = ancien.pages.map((page) => ({
          ...page,
          data: (page.data ?? []).map((n) => {
            const d = n?.data as { kind?: unknown; messageId?: unknown } | undefined;
            if (
              d?.messageId !== messageId ||
              (d?.kind !== "mention" && d?.kind !== "reponse") ||
              n.message === CORPS_MESSAGE_SUPPRIME
            ) {
              return n;
            }
            change = true;
            return { ...n, message: CORPS_MESSAGE_SUPPRIME };
          }),
        }));
        return change ? { ...ancien, pages } : ancien;
      }
    );
  };

  // Socket PARTAGÉ du backoffice : l'ancienne version ouvrait une connexion
  // par montage sans jamais la fermer (fuite mesurée par l'audit).
  useEffect(() => {
    const socket = acquireSocket();
    if (!socket) return;
    const onConnect = () => setConnected(true);
    if (socket.connected) setConnected(true);
    socket.on("connect", onConnect);
    socket.on("notification:new", handleNewNotification);
    socket.on("message:supprime", handleMessageSupprime);
    socket.on("notification:bulk_read", handleLectureGroupee);

    return () => {
      socket.off("connect", onConnect);
      socket.off("notification:new", handleNewNotification);
      socket.off("message:supprime", handleMessageSupprime);
      socket.off("notification:bulk_read", handleLectureGroupee);
      releaseSocket();
    };
  }, [queryClient, userId]);

  // ✅ Mutation pour marquer comme lu (optimiste)
  const markAsReadMutation = useMutation({
    mutationFn: (notificationId: string) =>
      NotificationAPI.markAsRead(notificationId),
    onMutate: async (notificationId) => {
      await queryClient.cancelQueries({
        queryKey: ["notifications", userId],
      });

      const previousNotifications = queryClient.getQueryData<
        InfiniteData<NotificationPage>
      >(["notifications", userId]);

      if (previousNotifications) {
        queryClient.setQueryData<InfiniteData<NotificationPage>>(
          ["notifications", userId],
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
          ["notifications", userId],
          context.previousNotifications
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: ["notification-stats", userId],
      });
    },
  });

  // ✅ Mutation pour marquer comme non lu (optimiste)

  const markAsUnreadMutation = useMutation({
    mutationFn: (notificationId: string) =>
      NotificationAPI.markAsUnread(notificationId),
    onMutate: async (notificationId) => {
      await queryClient.cancelQueries({
        queryKey: ["notifications", userId],
      });

      const previousNotifications = queryClient.getQueryData<
        InfiniteData<NotificationPage>
      >(["notifications", userId]);

      if (previousNotifications) {
        queryClient.setQueryData<InfiniteData<NotificationPage>>(
          ["notifications", userId],
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
          ["notifications", userId],
          context.previousNotifications
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: ["notification-stats", userId],
      });
    },
  });

  // ✅ Mutation pour marquer toutes comme lues (optimiste)
  const markAllAsReadMutation = useMutation({
    mutationFn: () => NotificationAPI.markAllAsRead(userId),
    onMutate: async () => {
      await queryClient.cancelQueries({
        queryKey: ["notifications", userId],
      });

      const previousNotifications = queryClient.getQueryData<
        InfiniteData<NotificationPage>
      >(["notifications", userId]);

      if (previousNotifications) {
        queryClient.setQueryData<InfiniteData<NotificationPage>>(
          ["notifications", userId],
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
          ["notifications", userId],
          context.previousNotifications
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: ["notification-stats", userId],
      });
    },
  });

  // ✅ Mutation pour supprimer une notification (optimiste)
  const deleteNotificationMutation = useMutation({
    mutationFn: (notificationId: string) =>
      NotificationAPI.deleteNotification(notificationId),
    onMutate: async (notificationId) => {
      await queryClient.cancelQueries({
        queryKey: ["notifications", userId],
      });

      const previousNotifications = queryClient.getQueryData<
        InfiniteData<NotificationPage>
      >(["notifications", userId]);

      if (previousNotifications) {
        queryClient.setQueryData<InfiniteData<NotificationPage>>(
          ["notifications", userId],
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
          ["notifications", userId],
          context.previousNotifications
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: ["notification-stats", userId],
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
    socketConnected: connected,
  };
};
