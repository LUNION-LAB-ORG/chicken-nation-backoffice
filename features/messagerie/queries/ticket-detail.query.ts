import { useQuery } from '@tanstack/react-query';
import { ticketAPI } from '../apis/ticket.api';
import { ticketKeyQuery } from './index.query';

export const useTicketDetailQuery = (id: string | null, enabled = true) => {
  return useQuery({
    queryKey: ticketKeyQuery('detail', id),
    queryFn: () => ticketAPI.obtenirParId(id!),
    enabled: enabled && !!id,
    staleTime: 5 * 1000,
    // Le socket pousse déjà les nouveaux messages ; ce filet passe de
    // 10 s à 2 min pour couvrir une éventuelle coupure de socket.
    refetchInterval: 2 * 60 * 1000,
  });
};
