import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { ticketAPI } from '../apis/ticket.api';
import { ticketKeyQuery, ticketStatsKeyQuery } from './index.query';
import type { IFiltresTicket } from '../types/ticket.type';

export const useTicketListQuery = (filtres: IFiltresTicket = {}, enabled = true) => {
  return useQuery({
    queryKey: ticketKeyQuery('list', filtres),
    queryFn: () => ticketAPI.obtenirTous(filtres),
    enabled,
    staleTime: 5 * 1000,
    refetchInterval: 10 * 1000,
  });
};

export const useTicketListInfiniteQuery = (filtres: IFiltresTicket = {}, enabled = true) => {
  return useInfiniteQuery({
    queryKey: ticketKeyQuery('list-infinite', filtres),
    queryFn: ({ pageParam = 1 }) => ticketAPI.obtenirTous({ ...filtres }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (!lastPage?.meta) return undefined;
      return lastPage.meta.page < lastPage.meta.totalPages ? lastPage.meta.page + 1 : undefined;
    },
    enabled,
    staleTime: 5 * 1000,
    refetchInterval: 10 * 1000,
  });
};

export const useTicketStatsQuery = (enabled = true) => {
  return useQuery({
    queryKey: ticketStatsKeyQuery(),
    queryFn: ticketAPI.obtenirStats,
    enabled,
    staleTime: 60 * 1000,
    refetchInterval: 2 * 60 * 1000,
  });
};
