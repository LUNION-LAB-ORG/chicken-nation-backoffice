import { useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { ticketKeyQuery, ticketStatsKeyQuery } from '../queries/index.query';
import { useAuthStore } from '../../users/hook/authStore';
import { acquireSocket, releaseSocket, shouldPlayOnce } from './sharedSocket';

interface UseTicketSocketSyncProps {
  enabled?: boolean;
  onNewTicket?: (data: any) => void;
  onTicketUpdate?: (data: any) => void;
  playSound?: boolean;
}

/**
 * Synchronise les tickets en direct via le socket PARTAGÉ du backoffice.
 * Une seule connexion pour toutes les vues, un seul son par événement.
 */
export const useTicketSocketSync = ({
  enabled = true,
  onNewTicket,
  onTicketUpdate,
  playSound = false,
}: UseTicketSocketSyncProps = {}) => {
  const queryClient = useQueryClient();
  const currentUserId = useAuthStore((s) => s.user?.id);

  const invalidateTickets = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ticketKeyQuery() });
    queryClient.invalidateQueries({ queryKey: ticketStatsKeyQuery() });
  }, [queryClient]);

  useEffect(() => {
    if (!enabled) return;

    const socket = acquireSocket();
    if (!socket) return;

    const audio =
      playSound && typeof window !== 'undefined'
        ? new Audio('/musics/notification-sound.mp3')
        : null;
    if (audio) audio.volume = 0.5;

    const playFor = (key: string) => {
      if (audio && shouldPlayOnce(key)) {
        audio.currentTime = 0;
        audio.play().catch(() => {});
      }
    };

    const onNew = (data: any) => {
      playFor(`ticket:${data?.id ?? data?.ticketId ?? ''}`);
      onNewTicket?.(data);
      invalidateTickets();
    };

    const onUpdate = (data: any) => {
      onTicketUpdate?.(data);
      const ticketId = data?.id || data?.ticketId;
      if (ticketId) {
        queryClient.invalidateQueries({ queryKey: ticketKeyQuery('detail', ticketId) });
      }
      invalidateTickets();
    };

    const onNewTicketMessage = (data: any) => {
      const authorId = data?.authorUser?.id || data?.message?.authorUser?.id;
      if (authorId !== currentUserId) {
        playFor(`tmsg:${data?.message?.id ?? data?.id ?? ''}`);
      }
      if (data?.ticketId) {
        queryClient.invalidateQueries({ queryKey: ticketKeyQuery('detail', data.ticketId) });
      }
      queryClient.invalidateQueries({ queryKey: ticketKeyQuery('list') });
      queryClient.invalidateQueries({ queryKey: ticketStatsKeyQuery() });
    };

    const onReadTicketMessages = (data: any) => {
      if (data?.ticketId) {
        queryClient.invalidateQueries({ queryKey: ticketKeyQuery('detail', data.ticketId) });
      }
      queryClient.invalidateQueries({ queryKey: ticketStatsKeyQuery() });
    };

    const onAssigned = (data: any) => {
      onTicketUpdate?.(data);
      invalidateTickets();
    };

    const onCreated = (data: any) => {
      onNewTicket?.(data);
      invalidateTickets();
    };

    socket.on('new:ticket', onNew);
    socket.on('update:ticket', onUpdate);
    socket.on('new:ticket_message', onNewTicketMessage);
    socket.on('read:ticket_messages', onReadTicketMessages);
    socket.on('assigned:ticket', onAssigned);
    socket.on('created:ticket', onCreated);

    return () => {
      socket.off('new:ticket', onNew);
      socket.off('update:ticket', onUpdate);
      socket.off('new:ticket_message', onNewTicketMessage);
      socket.off('read:ticket_messages', onReadTicketMessages);
      socket.off('assigned:ticket', onAssigned);
      socket.off('created:ticket', onCreated);
      releaseSocket();
    };
  }, [enabled, currentUserId, queryClient, invalidateTickets, onNewTicket, onTicketUpdate, playSound]);
};
