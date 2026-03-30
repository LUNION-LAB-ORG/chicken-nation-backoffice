import { useMutation, useQueryClient } from '@tanstack/react-query';
import { conversationAPI } from '../apis/conversation.api';
import { conversationKeyQuery, messageKeyQuery, statsMessagesKeyQuery } from './index.query';

export const useMarquerLuMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (conversationId: string) => conversationAPI.marquerLu(conversationId),
    onSuccess: (_, conversationId) => {
      queryClient.setQueryData(messageKeyQuery(conversationId), (old: any) => {
        if (!old) return old;
        if (old.pages) {
          return {
            ...old,
            pages: old.pages.map((page: any) => ({
              ...page,
              data: page.data?.map((m: any) => ({ ...m, isRead: true })) || [],
            })),
          };
        }
        return old;
      });

      queryClient.invalidateQueries({ queryKey: conversationKeyQuery() });
      queryClient.invalidateQueries({ queryKey: statsMessagesKeyQuery() });
    },
  });
};
