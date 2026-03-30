import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ticketAPI } from '../apis/ticket.api';
import { ticketKeyQuery, ticketStatsKeyQuery } from './index.query';
import type { IModifierTicketDTO, IEnvoyerMessageTicketDTO } from '../types/ticket.type';

export const useModifierTicketMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: IModifierTicketDTO }) =>
      ticketAPI.modifier(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ticketKeyQuery('detail', id) });
      queryClient.invalidateQueries({ queryKey: ticketKeyQuery('list') });
      queryClient.invalidateQueries({ queryKey: ticketStatsKeyQuery() });
    },
  });
};

export const useModifierStatutTicketMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      ticketAPI.modifierStatut(id, status),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ticketKeyQuery('detail', id) });
      queryClient.invalidateQueries({ queryKey: ticketKeyQuery('list') });
      queryClient.invalidateQueries({ queryKey: ticketStatsKeyQuery() });
    },
  });
};

export const useModifierPrioriteTicketMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, priority }: { id: string; priority: string }) =>
      ticketAPI.modifierPriorite(id, priority),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ticketKeyQuery('detail', id) });
      queryClient.invalidateQueries({ queryKey: ticketKeyQuery('list') });
    },
  });
};

export const useSupprimerTicketMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => ticketAPI.supprimer(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ticketKeyQuery() });
      queryClient.invalidateQueries({ queryKey: ticketStatsKeyQuery() });
    },
  });
};

export const useAssignerTicketMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ ticketId, assigneeId }: { ticketId: string; assigneeId: string }) =>
      ticketAPI.assigner(ticketId, assigneeId),
    onSuccess: (_, { ticketId }) => {
      queryClient.invalidateQueries({ queryKey: ticketKeyQuery('detail', ticketId) });
      queryClient.invalidateQueries({ queryKey: ticketKeyQuery('list') });
    },
  });
};

export const useEnvoyerMessageTicketMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ ticketId, data }: { ticketId: string; data: IEnvoyerMessageTicketDTO }) =>
      ticketAPI.envoyerMessage(ticketId, data),
    onSuccess: (_, { ticketId }) => {
      queryClient.invalidateQueries({ queryKey: ticketKeyQuery('detail', ticketId) });
      queryClient.invalidateQueries({ queryKey: ticketKeyQuery('list') });
    },
  });
};
