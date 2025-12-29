import { useEffect, useRef, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getAllOrders } from '../../features/orders/services/order-service';
import { OrderStatus } from '../../features/orders/types/order.types';
import { useSocket } from '@/hooks/useSocket';

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
  const socket = useSocket();

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const queryClient = useQueryClient();

  const canPlaySound =
    user && !['ADMIN', 'MARKETING'].includes(user.role?.toUpperCase());

  const { data: ordersPending } = useQuery({
    queryKey: ['order', selectedRestaurant],
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

  const invalidateOrders = () => {
    queryClient.invalidateQueries({
      queryKey: ['order'],
      exact: false,
    });
  };

  // 🔥 SOCKET EVENTS
  useEffect(() => {
    if (!socket || !canPlaySound) return;

    socket.on('order:created', invalidateOrders);
    socket.on('order:updated', invalidateOrders);
    socket.on('order:status_updated', invalidateOrders);
    socket.on('order:delete', invalidateOrders);

    return () => {
      socket.off('order:created', invalidateOrders);
      socket.off('order:updated', invalidateOrders);
      socket.off('order:status_updated', invalidateOrders);
      socket.off('order:delete', invalidateOrders);
    };
  }, [socket, canPlaySound]);

  // 🎵 AUDIO
  useEffect(() => {
    if (!audioRef.current && typeof window !== 'undefined') {
      audioRef.current = new Audio('/musics/pending-order.mp3');
    }

    if (!canPlaySound || disabledSound) {
      stopSound();
      return;
    }

    if (hasPendingOrders && !isPlaying) startSound();
    if (!hasPendingOrders && isPlaying) stopSound();

    return stopSound;
  }, [hasPendingOrders, disabledSound, canPlaySound]);

  const playSound = () => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = 0;
    audioRef.current.play().catch(console.error);
  };

  const startSound = () => {
    if (isPlaying) return;
    setIsPlaying(true);
    playSound();
    intervalRef.current = setInterval(playSound, 3000);
  };

  const stopSound = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;

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
