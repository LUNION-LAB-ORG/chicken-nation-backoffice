import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { statsMessagesKeyQuery, ticketStatsKeyQuery } from '../queries/index.query';
import { acquireSocket, releaseSocket } from './sharedSocket';

/**
 * Tient à jour les BADGES de la sidebar (conversations et tickets non lus)
 * partout dans le backoffice, pas seulement dans le module Messages.
 *
 * Avant : les compteurs ne bougeaient que par un polling de deux minutes dès
 * qu'on quittait le module. Monté une fois à côté de la cloche, ce hook
 * invalide les stats à chaque événement entrant, sur le socket partagé.
 */
export const useSupportBadgesSync = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const socket = acquireSocket();
    if (!socket) return;

    const refreshMessages = () => {
      queryClient.invalidateQueries({ queryKey: statsMessagesKeyQuery() });
    };
    const refreshTickets = () => {
      queryClient.invalidateQueries({ queryKey: ticketStatsKeyQuery() });
    };

    socket.on('new:message', refreshMessages);
    socket.on('messages:read', refreshMessages);
    socket.on('new:conversation', refreshMessages);
    socket.on('new:ticket', refreshTickets);
    socket.on('new:ticket_message', refreshTickets);
    socket.on('read:ticket_messages', refreshTickets);
    socket.on('update:ticket', refreshTickets);

    return () => {
      socket.off('new:message', refreshMessages);
      socket.off('messages:read', refreshMessages);
      socket.off('new:conversation', refreshMessages);
      socket.off('new:ticket', refreshTickets);
      socket.off('new:ticket_message', refreshTickets);
      socket.off('read:ticket_messages', refreshTickets);
      socket.off('update:ticket', refreshTickets);
      releaseSocket();
    };
  }, [queryClient]);
};
