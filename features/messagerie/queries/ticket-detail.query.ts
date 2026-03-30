import { useQuery } from '@tanstack/react-query';
import { ticketAPI } from '../apis/ticket.api';
import { ticketKeyQuery } from './index.query';

export const useTicketDetailQuery = (id: string | null, enabled = true) => {
  return useQuery({
    queryKey: ticketKeyQuery('detail', id),
    queryFn: () => ticketAPI.obtenirParId(id!),
    enabled: enabled && !!id,
    staleTime: 5 * 1000,
    refetchInterval: 10 * 1000,
  });
};
