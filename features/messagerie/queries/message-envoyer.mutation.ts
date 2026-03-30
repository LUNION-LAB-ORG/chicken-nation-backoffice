import { useMutation, useQueryClient } from '@tanstack/react-query';
import { conversationAPI } from '../apis/conversation.api';
import { conversationKeyQuery, messageKeyQuery, statsMessagesKeyQuery } from './index.query';
import type { IMessage } from '../types/conversation.type';

export const useEnvoyerMessageMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ conversationId, body }: { conversationId: string; body: string }) =>
      conversationAPI.envoyerMessage(conversationId, body),

    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: messageKeyQuery(variables.conversationId) });
      const previous = queryClient.getQueryData(messageKeyQuery(variables.conversationId));

      const optimistic: Partial<IMessage> = {
        id: `temp-${Date.now()}`,
        body: variables.body,
        createdAt: new Date().toISOString(),
        isRead: true,
        authorUser: { id: 'current-user', name: 'Moi', email: '' },
      };

      queryClient.setQueryData(messageKeyQuery(variables.conversationId), (old: any) => {
        if (old?.pages) {
          const pages = [...old.pages];
          if (pages.length === 0) {
            pages.push({ data: [optimistic], meta: { page: 1, limit: 100, total: 1, totalPages: 1 } });
          } else {
            const last = { ...pages[pages.length - 1] };
            last.data = [...(last.data || []), optimistic];
            pages[pages.length - 1] = last;
          }
          return { ...old, pages };
        }
        return old;
      });

      return { previous };
    },

    onError: (_err, variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(messageKeyQuery(variables.conversationId), context.previous);
      }
    },

    onSuccess: (newMessage, variables) => {
      queryClient.setQueryData(messageKeyQuery(variables.conversationId), (old: any) => {
        if (old?.pages) {
          const pages = old.pages.map((page: any) => ({
            ...page,
            data: page.data?.map((msg: any) =>
              msg.id?.toString?.().startsWith('temp-') && msg.body === variables.body ? newMessage : msg
            ) || [],
          }));
          return { ...old, pages };
        }
        return old;
      });

      queryClient.invalidateQueries({ queryKey: conversationKeyQuery() });
      queryClient.invalidateQueries({ queryKey: statsMessagesKeyQuery() });
    },

    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({ queryKey: messageKeyQuery(variables.conversationId) });
    },
  });
};
