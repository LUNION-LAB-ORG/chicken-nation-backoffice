import { useEffect, useRef, useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { io, Socket } from 'socket.io-client';
import { NotificationAPI } from '@/services/notificationService';
import { Ticket } from '@/types/tickets';
import { SOCKET_URL } from '@/config';

interface SocketTicketData {
  ticketId?: string;
  ticket?: Ticket;
  message?: unknown;
  [key: string]: unknown;
}

interface UseTicketsSocketProps {
  ticketId?: string | null;
  userId?: string;
  enabled?: boolean;
  onNewTicket?: (data: SocketTicketData) => void;
  onTicketUpdate?: (data: SocketTicketData) => void;
  playSound?: boolean;
}

interface UseTicketsSocketReturn {
  socketConnected: boolean;
  refetchTickets: () => void;
  refetchTicketStats: () => void;
}

export const useTicketsSocket = ({
  ticketId,
  userId,
  enabled = true,
  onNewTicket,
  onTicketUpdate,
  playSound = false,
}: UseTicketsSocketProps): UseTicketsSocketReturn => {
  const [socketConnected, setSocketConnected] = useState(false);
  const queryClient = useQueryClient();
  const socketRef = useRef<Socket | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const refetchTickets = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['tickets'] });
    queryClient.invalidateQueries({ queryKey: ['tickets-infinite'] });
  }, [queryClient]);

  const refetchTicketStats = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['ticket-stats'] });
  }, [queryClient]);

  const handleNewTicket = useCallback((data: SocketTicketData) => {
    if (playSound && audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
    }

    onNewTicket?.(data);

    queryClient.invalidateQueries({ queryKey: ['tickets'] });
    queryClient.invalidateQueries({ queryKey: ['tickets-infinite'] });
    queryClient.invalidateQueries({ queryKey: ['ticket-stats'] });
  }, [queryClient, onNewTicket, playSound]);

  const handleTicketUpdate = useCallback((data: SocketTicketData) => {
    onTicketUpdate?.(data);

    if (data.ticketId || (data as any)?.id) {
      queryClient.invalidateQueries({ queryKey: ['ticket', data.ticketId || (data as any)?.id] });
    }

    queryClient.invalidateQueries({ queryKey: ['tickets'] });
    queryClient.invalidateQueries({ queryKey: ['tickets-infinite'] });
    queryClient.invalidateQueries({ queryKey: ['ticket-stats'] });
  }, [queryClient, onTicketUpdate]);

  const handleNewTicketMessage = useCallback((data: SocketTicketData) => {
    if (playSound && audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
    }

    // Invalidate the specific ticket to refresh its messages
    if (data.ticketId) {
      queryClient.invalidateQueries({ queryKey: ['ticket', data.ticketId] });
    }

    queryClient.invalidateQueries({ queryKey: ['tickets'] });
    queryClient.invalidateQueries({ queryKey: ['tickets-infinite'] });
  }, [queryClient, playSound]);

  useEffect(() => {
    if (!enabled) return;

    if (playSound && !audioRef.current && typeof window !== 'undefined') {
      audioRef.current = new Audio('/musics/ticket-notification.mp3');
      audioRef.current.volume = 0.5;
    }

    const baseQuery: Record<string, string> = {
      token: NotificationAPI.getToken() || '',
      type: 'user',
    };
    const query = userId ? { ...baseQuery, userId } : baseQuery;

    const socket = io(SOCKET_URL, { query });
    socketRef.current = socket;

    socket.on('connect', () => setSocketConnected(true));
    socket.on('disconnect', () => setSocketConnected(false));

    // Match backend events exactly (support-websocket.service.ts)
    socket.on('new:ticket', handleNewTicket);
    socket.on('update:ticket', handleTicketUpdate);
    socket.on('new:ticket_message', handleNewTicketMessage);
    socket.on('read:ticket_messages', (data: { ticketId: string }) => {
      if (data.ticketId) {
        queryClient.invalidateQueries({ queryKey: ['ticket', data.ticketId] });
      }
    });

    // Also listen for assigned/created events targeted at specific users
    socket.on('assigned:ticket', handleTicketUpdate);
    socket.on('created:ticket', handleNewTicket);

    return () => {
      socket.offAny();
      socket.disconnect();
      socketRef.current = null;
      setSocketConnected(false);
    };
  }, [
    enabled,
    userId,
    handleNewTicket,
    handleTicketUpdate,
    handleNewTicketMessage,
    queryClient,
    playSound
  ]);

  return {
    socketConnected,
    refetchTickets,
    refetchTicketStats,
  };
};
