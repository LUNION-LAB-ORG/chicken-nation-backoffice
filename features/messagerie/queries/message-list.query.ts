import { useInfiniteQuery } from '@tanstack/react-query';
import { conversationAPI } from '../apis/conversation.api';
import { messageKeyQuery } from './index.query';

const PAGE_SIZE = 100;

export const useMessageListQuery = (conversationId: string | null, enabled = true) => {
  return useInfiniteQuery({
    queryKey: messageKeyQuery(conversationId || ''),
    queryFn: ({ pageParam = 1 }) => {
      if (!conversationId) return { data: [], meta: { page: 1, limit: PAGE_SIZE, total: 0, totalPages: 0 } };
      return conversationAPI.obtenirMessages(conversationId, pageParam, PAGE_SIZE);
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (!lastPage?.meta) return undefined;
      return lastPage.meta.page < lastPage.meta.totalPages ? lastPage.meta.page + 1 : undefined;
    },
    enabled: enabled && !!conversationId,
    staleTime: 2 * 60 * 1000,
    refetchInterval: false,
    refetchIntervalInBackground: false,
  });
};
