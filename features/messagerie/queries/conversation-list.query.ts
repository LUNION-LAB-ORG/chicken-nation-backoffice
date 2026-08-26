import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { conversationAPI } from '../apis/conversation.api';
import { conversationKeyQuery, statsMessagesKeyQuery } from './index.query';

/** Taille de page de la liste des conversations. */
export const TAILLE_PAGE_CONVERSATIONS = 20;

export const useConversationListQuery = (enabled = true) => {
  return useQuery({
    queryKey: conversationKeyQuery('list'),
    queryFn: () => conversationAPI.obtenirTous(1, 50),
    enabled,
    staleTime: 2 * 60 * 1000,
    refetchInterval: 3 * 60 * 1000,
    refetchIntervalInBackground: false,
  });
};

export const useConversationListInfiniteQuery = (enabled = true) => {
  return useInfiniteQuery({
    queryKey: conversationKeyQuery('list-infinite'),
    queryFn: ({ pageParam = 1 }) => conversationAPI.obtenirTous(pageParam, TAILLE_PAGE_CONVERSATIONS),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (!lastPage?.meta) return undefined;
      return lastPage.meta.page < lastPage.meta.totalPages ? lastPage.meta.page + 1 : undefined;
    },
    enabled,
    staleTime: 2 * 60 * 1000,
    /**
     * ⚠️ PAS de `refetchInterval` : sur une requête infinie il redemande TOUTES
     * les pages chargées, en série. La fraîcheur vient du socket.
     */
  });
};

export const useStatsMessagesQuery = (enabled = true) => {
  return useQuery({
    queryKey: statsMessagesKeyQuery(),
    queryFn: conversationAPI.obtenirStats,
    enabled,
    staleTime: 60 * 1000,
    refetchInterval: 2 * 60 * 1000,
  });
};
