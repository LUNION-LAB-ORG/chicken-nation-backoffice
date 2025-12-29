import { useEffect, useRef, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { io } from 'socket.io-client';
import { SOCKET_URL } from '../../socket';
import {
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import NotificationAPI from '@/services/notificationService';
import { getAllOrders } from '../../features/orders/services/order-service';
import { OrderStatus } from '../../features/orders/types/order.types';

interface UsePendingOrdersSoundParams {
  activeFilter: string;
  selectedRestaurant?: string;
  disabledSound: boolean;
}

export const usePendingOrdersSound = ({
  activeFilter,
  selectedRestaurant,
  disabledSound,
}: UsePendingOrdersSoundParams) => {
  const { user } = useAuthStore();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const queryClient = useQueryClient();

  // Déterminer si l'utilisateur a le droit d'entendre le son
  const canPlaySound = user && !['ADMIN', 'MARKETING'].includes(user.role?.toUpperCase());

  // Hook pour récupérer le statut des commandes en attente
  const { data: ordersPending } = useQuery({
    queryKey: ['orders', selectedRestaurant],
    queryFn: async () => {
      const result = await getAllOrders({
        status: OrderStatus.PENDING,
        restaurantId: selectedRestaurant,
        limit: 1,
      });
      return result.data;
    },
    enabled: Boolean(canPlaySound) && Boolean(selectedRestaurant),
    staleTime: 30 * 1000,
    refetchOnWindowFocus: false,
  });

  const hasPendingOrders = ordersPending?.length > 0;

  // Fonction d'invalidation de la cache de React Query
  const handleInvalidateQueries = (data) => {
    queryClient.invalidateQueries({
      queryKey: ['orders'],
      exact: false,
    });
  };

  // Initialisation et gestion du WebSocket
  useEffect(() => {
    if (!canPlaySound) return;

    const socket = io(SOCKET_URL, {
      query: {
        token: NotificationAPI.getToken(),
        type: "user",
      },
    });
    socket.on('order:created', (data) => handleInvalidateQueries(data));
    socket.on('order:status_updated', (data) => handleInvalidateQueries(data));
    socket.on('order:updated', (data) => handleInvalidateQueries(data));
    socket.on('order:delete', (data) => handleInvalidateQueries(data));

    return () => {
      if (socket) {
        socket.off('order:created');
        socket.off('order:status_updated');
        socket.off('order:updated');
        socket.disconnect();
      }
    };
  }, [canPlaySound]);

  // Initialisation de l'audio et gestion de la lecture/pause
  useEffect(() => {
    // Créer l'instance audio côté client
    if (!audioRef.current && typeof window !== 'undefined') {
      audioRef.current = new Audio("/musics/pending-order.mp3");
      audioRef.current.loop = false;
    }

    // Si la lecture n'est pas autorisée ou que le son est désactivé, on arrête tout
    if (!canPlaySound || disabledSound) {
      stopContinuousSound();
      return;
    }

    if (hasPendingOrders && !isPlaying) {
      startContinuousSound();
    } else if (!hasPendingOrders && isPlaying) {
      stopContinuousSound();
    }

    // La fonction de nettoyage pour cet useEffect
    return () => {
      stopContinuousSound();
    };

  }, [hasPendingOrders, disabledSound, canPlaySound]);

  // Fonction pour jouer le son en continu
  const playSound = () => {
    if (audioRef.current && !disabledSound && canPlaySound) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch((error) => {
        console.error("Erreur de lecture audio pour commandes en attente", error);
      });
    }
  };

  const startContinuousSound = () => {
    if (isPlaying) return; // Ne rien faire si le son est déjà en lecture
    setIsPlaying(true);
    playSound(); // Jouer immédiatement
    intervalRef.current = setInterval(playSound, 3000); // Puis répéter toutes les 3 secondes
  };

  const stopContinuousSound = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlaying(false);
  };

  return {
    hasPendingOrders,
    isPlaying,
    pendingOrdersCount: ordersPending?.length || 0,
  };
};