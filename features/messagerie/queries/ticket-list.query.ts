import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { ticketAPI } from '../apis/ticket.api';
import { ticketKeyQuery, ticketStatsKeyQuery } from './index.query';
import type { IFiltresTicket } from '../types/ticket.type';

/**
 * Taille de page des listes. Assez grande pour remplir un écran d'un coup,
 * assez petite pour que la réponse reste légère : chaque ticket embarque ses
 * messages et leurs auteurs.
 */
export const TAILLE_PAGE = 20;

export const useTicketListQuery = (filtres: IFiltresTicket = {}, enabled = true) => {
  return useQuery({
    queryKey: ticketKeyQuery('list', filtres),
    queryFn: () => ticketAPI.obtenirTous(filtres),
    enabled,
    staleTime: 30 * 1000,
    refetchInterval: 3 * 60 * 1000,
  });
};

export const useTicketListInfiniteQuery = (filtres: IFiltresTicket = {}, enabled = true) => {
  return useInfiniteQuery({
    queryKey: ticketKeyQuery('list-infinite', filtres),
    // ⚠️ `pageParam` DOIT être transmis. Sans lui, chaque « page suivante »
    // redemandait la page 1 : la liste ne grandissait jamais et le défilement
    // tournait en boucle sur les mêmes dix tickets.
    queryFn: ({ pageParam = 1 }) => ticketAPI.obtenirTous(filtres, pageParam as number, TAILLE_PAGE),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (!lastPage?.meta) return undefined;
      return lastPage.meta.page < lastPage.meta.totalPages ? lastPage.meta.page + 1 : undefined;
    },
    enabled,
    staleTime: 30 * 1000,
    /**
     * ⚠️ PAS de `refetchInterval` ici, contrairement à la requête simple.
     *
     * Sur une requête infinie, un rafraîchissement redemande TOUTES les pages
     * déjà chargées, en série. Avec cinq pages ouvertes, c'est cinq requêtes
     * toutes les trois minutes, et autant à chaque message reçu par le socket.
     * La fraîcheur vient déjà du socket, qui invalide la liste au bon moment.
     */
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
