import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ticketAPI } from '../apis/ticket.api';
import { ticketKeyQuery, ticketStatsKeyQuery } from './index.query';
import type { ICreerTicketDTO } from '../types/ticket.type';

export const useCreerTicketMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ICreerTicketDTO) => ticketAPI.creer(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ticketKeyQuery() });
      queryClient.invalidateQueries({ queryKey: ticketStatsKeyQuery() });
    },
  });
};

export const useEscaladerConversationMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { conversationId: string; title: string; priority: string; category?: string }) =>
      ticketAPI.escalader(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ticketKeyQuery() });
      queryClient.invalidateQueries({ queryKey: ticketStatsKeyQuery() });
    },
  });
};
