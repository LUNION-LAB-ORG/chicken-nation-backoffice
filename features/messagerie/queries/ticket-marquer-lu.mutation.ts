import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ticketAPI } from '../apis/ticket.api';
import { ticketKeyQuery, ticketStatsKeyQuery } from './index.query';

export const useMarquerLuTicketMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ticketId: string) => ticketAPI.marquerLu(ticketId),
    onSuccess: (_, ticketId) => {
      // Invalider le détail du ticket et les stats pour mettre à jour le badge
      queryClient.invalidateQueries({ queryKey: ticketKeyQuery('detail', ticketId) });
      queryClient.invalidateQueries({ queryKey: ticketKeyQuery('list') });
      queryClient.invalidateQueries({ queryKey: ticketStatsKeyQuery() });
    },
  });
};
