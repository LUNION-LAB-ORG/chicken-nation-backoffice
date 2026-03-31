import { useEffect, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { io, Socket } from 'socket.io-client';
import { NotificationAPI } from '../../../src/services/notificationService';
import { SOCKET_URL } from '../../../src/config';
import { ticketKeyQuery, ticketStatsKeyQuery } from '../queries/index.query';
import { useAuthStore } from '../../users/hook/authStore';

interface UseTicketSocketSyncProps {
  enabled?: boolean;
  onNewTicket?: (data: any) => void;
  onTicketUpdate?: (data: any) => void;
  playSound?: boolean;
}

export const useTicketSocketSync = ({
  enabled = true,
  onNewTicket,
  onTicketUpdate,
  playSound = false,
}: UseTicketSocketSyncProps = {}) => {
  const queryClient = useQueryClient();
  const currentUserId = useAuthStore((s) => s.user?.id);
  const socketRef = useRef<Socket | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const invalidateTickets = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ticketKeyQuery() });
    queryClient.invalidateQueries({ queryKey: ticketStatsKeyQuery() });
  }, [queryClient]);

  useEffect(() => {
    if (!enabled) return;

    if (playSound && !audioRef.current && typeof window !== 'undefined') {
      audioRef.current = new Audio('/musics/notification-sound.mp3');
      audioRef.current.volume = 0.5;
    }

    const socket = io(SOCKET_URL, {
      query: {
        token: NotificationAPI.getToken() || '',
        type: 'user',
      },
    });
    socketRef.current = socket;

    // Backend events (support-websocket.service.ts)
    socket.on('new:ticket', (data: any) => {
      if (playSound && audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(() => {});
      }
      onNewTicket?.(data);
      invalidateTickets();
    });

    socket.on('update:ticket', (data: any) => {
      onTicketUpdate?.(data);
      const ticketId = data?.id || data?.ticketId;
      if (ticketId) {
        queryClient.invalidateQueries({ queryKey: ticketKeyQuery('detail', ticketId) });
      }
      invalidateTickets();
    });

    socket.on('new:ticket_message', (data: any) => {
      const authorId = data?.authorUser?.id || data?.message?.authorUser?.id;
      if (playSound && audioRef.current && authorId !== currentUserId) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(() => {});
      }
      if (data?.ticketId) {
        queryClient.invalidateQueries({ queryKey: ticketKeyQuery('detail', data.ticketId) });
      }
      queryClient.invalidateQueries({ queryKey: ticketKeyQuery('list') });
    });

    socket.on('read:ticket_messages', (data: any) => {
      if (data?.ticketId) {
        queryClient.invalidateQueries({ queryKey: ticketKeyQuery('detail', data.ticketId) });
      }
    });

    // User-targeted events
    socket.on('assigned:ticket', (data: any) => {
      onTicketUpdate?.(data);
      invalidateTickets();
    });

    socket.on('created:ticket', (data: any) => {
      onNewTicket?.(data);
      invalidateTickets();
    });

    return () => {
      socket.offAny();
      socket.disconnect();
      socketRef.current = null;
    };
  }, [enabled, currentUserId, queryClient, invalidateTickets, onNewTicket, onTicketUpdate, playSound]);

  return { socket: socketRef.current };
};
