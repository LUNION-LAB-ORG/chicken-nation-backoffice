import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

// --- Conversations ---
export const conversationKeyQuery = (...params: unknown[]) => ['conversation', ...params];
export const messageKeyQuery = (conversationId: string, ...params: unknown[]) => ['message', conversationId, ...params];
export const statsMessagesKeyQuery = () => ['stats-messages'];

// --- Tickets ---
export const ticketKeyQuery = (...params: unknown[]) => ['ticket', ...params];
export const ticketStatsKeyQuery = () => ['ticket-stats'];
export const ticketCategorieKeyQuery = (...params: unknown[]) => ['ticket-categorie', ...params];

// --- Invalidation hooks ---
export const useInvalidateConversationQuery = () => {
  const queryClient = useQueryClient();
  return useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['conversation'] });
    queryClient.invalidateQueries({ queryKey: ['stats-messages'] });
  }, [queryClient]);
};

export const useInvalidateMessageQuery = (conversationId?: string) => {
  const queryClient = useQueryClient();
  return useCallback(() => {
    if (conversationId) {
      queryClient.invalidateQueries({ queryKey: ['message', conversationId] });
    }
    queryClient.invalidateQueries({ queryKey: ['conversation'] });
  }, [queryClient, conversationId]);
};

export const useInvalidateTicketQuery = () => {
  const queryClient = useQueryClient();
  return useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['ticket'] });
    queryClient.invalidateQueries({ queryKey: ['ticket-stats'] });
  }, [queryClient]);
};
