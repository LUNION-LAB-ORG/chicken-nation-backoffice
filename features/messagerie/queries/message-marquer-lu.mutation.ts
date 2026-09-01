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
              /**
               * ⚠️ On ne blanchit QUE les messages du camp d'en face.
               *
               * Ce cache forçait `isRead: true` sur TOUS les messages, alors
               * que le serveur ne marque que ceux du client. Conséquence :
               * dès qu'un agent ouvrait une conversation, ses PROPRES messages
               * affichaient « Vu », donnant à croire que le client les avait
               * lus alors qu'il n'était peut-être jamais revenu. Un accusé de
               * lecture qui ment est pire que pas d'accusé du tout.
               *
               * `readAt` et l'accusé de l'agent viennent désormais
               * exclusivement du serveur.
               */
              data:
                page.data?.map((m: any) => (m.authorCustomer ? { ...m, isRead: true } : m)) || [],
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
