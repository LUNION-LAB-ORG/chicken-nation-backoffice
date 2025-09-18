import { useEffect, useRef, useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { io, Socket } from 'socket.io-client';
import { SOCKET_URL } from '../../socket';
import { NotificationAPI } from '@/services/notificationService';
import { Ticket } from '@/types/tickets';

interface SocketTicketData {
  ticketId?: string;
  ticket?: Ticket;
  userId?: string;
  authorUser?: { id: string };
  status?: string;
  assignedToId?: string;
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

  // Fonction pour rafraîchir les tickets
  const refetchTickets = useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: ['tickets'],
    });
    queryClient.invalidateQueries({
      queryKey: ['tickets-infinite'],
    });
  }, [queryClient]);

  // Fonction pour rafraîchir les statistiques
  const refetchTicketStats = useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: ['ticket-stats'],
    });
  }, [queryClient]);

  // Gestionnaire pour les nouveaux tickets
  const handleNewTicket = useCallback((data: SocketTicketData) => {

    // Jouer le son si activé
    if (playSound && audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch((error) => {
        console.warn('Impossible de jouer le son:', error);
      });
    }

    // Callback personnalisé
    if (onNewTicket) {
      try {
        onNewTicket(data);
      } catch (err) {
        console.warn('Erreur onNewTicket callback', err);
      }
    }

    // Invalider les queries
    queryClient.invalidateQueries({
      queryKey: ['tickets'],
    });

    queryClient.invalidateQueries({
      queryKey: ['tickets-infinite'],
    });

    queryClient.invalidateQueries({
      queryKey: ['ticket-stats'],
    });
  }, [queryClient, onNewTicket, playSound]);

  // Gestionnaire pour les mises à jour de tickets
  const handleTicketUpdate = useCallback((data: SocketTicketData) => {

    // Callback personnalisé
    if (onTicketUpdate) {
      try {
        onTicketUpdate(data);
      } catch (err) {
        console.warn('Erreur onTicketUpdate callback', err);
      }
    }

    // Invalider les queries spécifiques
    if (data.ticketId) {
      queryClient.invalidateQueries({
        queryKey: ['ticket', data.ticketId],
      });
    }

    queryClient.invalidateQueries({
      queryKey: ['tickets'],
    });

    queryClient.invalidateQueries({
      queryKey: ['tickets-infinite'],
    });

    queryClient.invalidateQueries({
      queryKey: ['ticket-stats'],
    });
  }, [queryClient, onTicketUpdate]);

  // Gestionnaire pour les changements de statut
  const handleTicketStatusChange = useCallback((data: SocketTicketData) => {

    // Invalider les queries
    if (data.ticketId) {
      queryClient.invalidateQueries({
        queryKey: ['ticket', data.ticketId],
      });
    }

    queryClient.invalidateQueries({
      queryKey: ['tickets'],
    });

    queryClient.invalidateQueries({
      queryKey: ['ticket-stats'],
    });
  }, [queryClient]);

  // Gestionnaire pour les assignations
  const handleTicketAssignment = useCallback((data: SocketTicketData) => {

    // Invalider les queries
    if (data.ticketId) {
      queryClient.invalidateQueries({
        queryKey: ['ticket', data.ticketId],
      });
    }

    queryClient.invalidateQueries({
      queryKey: ['tickets'],
    });
  }, [queryClient]);

  useEffect(() => {
    if (!enabled) return;


    // Initialiser l'audio si nécessaire
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

    // Événements de connexion
    socket.on('connect', () => {
      setSocketConnected(true);
    });

    socket.on('disconnect', () => {
      setSocketConnected(false);
    });

    // Événements de tickets - Tous les formats possibles
    socket.on('ticket:new', handleNewTicket);
    socket.on('ticket:created', handleNewTicket);
    socket.on('new_ticket', handleNewTicket);
    socket.on('new:ticket', handleNewTicket);
    socket.on('ticket_created', handleNewTicket);

    // Événements de mise à jour
    socket.on('ticket:updated', handleTicketUpdate);
    socket.on('ticket:update', handleTicketUpdate);
    socket.on('ticket_updated', handleTicketUpdate);
    socket.on('update:ticket', handleTicketUpdate);

    // Événements de changement de statut
    socket.on('ticket:status', handleTicketStatusChange);
    socket.on('ticket:status_changed', handleTicketStatusChange);
    socket.on('ticket_status_changed', handleTicketStatusChange);

    // Événements d'assignation
    socket.on('ticket:assigned', handleTicketAssignment);
    socket.on('ticket:assignment', handleTicketAssignment);
    socket.on('ticket_assigned', handleTicketAssignment);

    // Événements génériques
    socket.on('ticket:event', (data) => {
      handleTicketUpdate(data);
    });

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
    handleTicketStatusChange,
    handleTicketAssignment,
    playSound
  ]);

  return {
    socketConnected,
    refetchTickets,
    refetchTicketStats,
  };
};