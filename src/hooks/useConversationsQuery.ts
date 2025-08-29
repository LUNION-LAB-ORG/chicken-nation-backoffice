import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { 
  getConversations, 
  getMessages, 
  sendMessage, 
  markMessagesAsRead,
  getMessageStats 
} from '@/services/messageService';
import { Message } from '@/types/messaging';

// Hook pour les conversations
export const useConversationsQuery = (enabled = true) => {
  return useQuery({
    queryKey: ['conversations'],
    queryFn: async () => {
      const response = await getConversations(1, 50); // Récupérer plus de conversations
      return response;
    },
    enabled,
    staleTime: 30 * 1000, // 30 secondes
    refetchInterval: 60 * 1000, // Refetch toutes les minutes
  });
};

// Hook pour les messages d'une conversation
export const useMessagesQuery = (conversationId: string | null, enabled = true) => {
  const PAGE_SIZE = 100; // charger 100 messages par page lors du scroll vers les anciens

  return useInfiniteQuery({
    queryKey: ['messages', conversationId],
    queryFn: async ({ pageParam = 1 }) => {
      if (!conversationId) return { data: [], meta: { page: 1, limit: PAGE_SIZE, total: 0, totalPages: 0 } };
      const response = await getMessages(conversationId, pageParam, PAGE_SIZE);
      return response;
    },
    getNextPageParam: (lastPage) => {
      if (!lastPage?.meta) return undefined;
      const next = lastPage.meta.page < lastPage.meta.totalPages ? lastPage.meta.page + 1 : undefined;
      return next;
    },
    enabled: enabled && !!conversationId,
    staleTime: 5 * 1000,
    refetchInterval: 10 * 1000,
    refetchIntervalInBackground: true,
  });
};

// Hook pour les statistiques des messages
export const useMessageStatsQuery = (enabled = true) => {
  return useQuery({
    queryKey: ['message-stats'],
    queryFn: getMessageStats,
    enabled,
    staleTime: 60 * 1000, // 1 minute
    refetchInterval: 2 * 60 * 1000, // Refetch toutes les 2 minutes
  });
};

// Hook pour envoyer un message
export const useSendMessageMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      conversationId, 
      content, 
      messageType, 
      file 
    }: { 
      conversationId: string; 
      content: string; 
      messageType?: 'TEXT' | 'IMAGE' | 'FILE'; 
      file?: File 
    }) => {
      return sendMessage(conversationId, content, messageType, file);
    },
    onMutate: async (variables) => {
      // Annuler les queries en cours pour éviter les conflits
      await queryClient.cancelQueries({ queryKey: ['messages', variables.conversationId] });
      
      // Snapshot de l'état actuel
      const previousMessages = queryClient.getQueryData(['messages', variables.conversationId]);
      
      // Ajouter optimistiquement le message (compatible with infiniteQuery pages)
      const optimisticMessage = {
        id: `temp-${Date.now()}`,
        content: variables.content,
        messageType: variables.messageType || 'TEXT',
        createdAt: new Date().toISOString(),
        isRead: true,
        authorUser: { id: 'current-user', name: 'Moi' }, // Utilisateur actuel
        conversationId: variables.conversationId,
      } as unknown as Message;

      queryClient.setQueryData(['messages', variables.conversationId], (oldData: any) => {
        // If using useInfiniteQuery shape
        if (oldData && Array.isArray(oldData.pages)) {
          const pages = oldData.pages.slice();
          if (pages.length === 0) {
            pages.push({ data: [optimisticMessage], meta: { page: 1, limit: 100, total: 1, totalPages: 1 } });
          } else {
            // append to last page
            const last = { ...pages[pages.length - 1] };
            last.data = Array.isArray(last.data) ? [...last.data, optimisticMessage] : [optimisticMessage];
            pages[pages.length - 1] = last;
          }
          return { ...oldData, pages };
        }

        // Legacy single-page shape
        if (!oldData) return { data: [optimisticMessage], meta: { page: 1, limit: 100, total: 1, totalPages: 1 } };
        return { ...oldData, data: Array.isArray(oldData.data) ? [...oldData.data, optimisticMessage] : [optimisticMessage] };
      });
      
      return { previousMessages };
    },
    onError: (err, variables, context) => {
      // Restaurer les données précédentes en cas d'erreur
      if (context?.previousMessages) {
        queryClient.setQueryData(['messages', variables.conversationId], context.previousMessages);
      }
    },
    onSuccess: (newMessage, variables) => {
      // Remplacer le message optimiste par le vrai message de l'API
      queryClient.setQueryData(['messages', variables.conversationId], (oldData: any) => {
        // Infinite pages shape
        if (oldData && Array.isArray(oldData.pages)) {
          const pages = oldData.pages.map((page: any) => {
            const data = Array.isArray(page.data)
              ? page.data.map((msg: any) => (msg.id?.toString?.().startsWith('temp-') && msg.content === variables.content ? newMessage : msg))
              : [];
            return { ...page, data };
          });
          return { ...oldData, pages };
        }

        // Legacy single-page shape
        if (!oldData) return { data: [newMessage], meta: { page: 1, limit: 100, total: 1, totalPages: 1 } };
        const updatedData = Array.isArray(oldData.data)
          ? oldData.data.map((msg: any) => (msg.id?.toString?.().startsWith('temp-') && msg.content === variables.content ? newMessage : msg))
          : [newMessage];
        return { ...oldData, data: updatedData };
      });
      
      // Invalider les conversations pour mettre à jour les previews
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({ queryKey: ['message-stats'] });
      
      console.log('✅ Message sent successfully, data updated');
    },
    onSettled: (newMessage, error, variables) => {
      // Toujours refetch pour s'assurer d'avoir les données à jour
      queryClient.invalidateQueries({ queryKey: ['messages', variables.conversationId] });
    }
  });
};

// Hook pour marquer comme lu
export const useMarkAsReadMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: markMessagesAsRead,
    onSuccess: (_, conversationId) => {
      // Mettre à jour optimistiquement les messages comme lus
      queryClient.setQueryData(['messages', conversationId], (oldData: any) => {
        if (!oldData) return oldData;
        // Infinite pages
        if (Array.isArray(oldData.pages)) {
          const pages = oldData.pages.map((page: any) => ({
            ...page,
            data: Array.isArray(page.data) ? page.data.map((m: any) => ({ ...m, isRead: true })) : []
          }));
          return { ...oldData, pages };
        }

        // Legacy shape
        return { ...oldData, data: Array.isArray(oldData.data) ? oldData.data.map((m: any) => ({ ...m, isRead: true })) : [] };
      });
      
      // Invalider les conversations et stats
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({ queryKey: ['message-stats'] });
    },
  });
};
