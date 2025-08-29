import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
  return useQuery({
    queryKey: ['messages', conversationId],
    queryFn: async () => {
      if (!conversationId) return { data: [], meta: { page: 1, limit: 50, total: 0, totalPages: 0 } };
      const response = await getMessages(conversationId, 1, 50);
      return response;
    },
    enabled: enabled && !!conversationId,
    staleTime: 5 * 1000, // 5 secondes - plus court pour la démo
    refetchInterval: 10 * 1000, // Polling toutes les 10 secondes en backup du WebSocket
    refetchIntervalInBackground: true, // Continue même quand l'onglet n'est pas actif
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
      
      // Ajouter optimistiquement le message
      const optimisticMessage = {
        id: `temp-${Date.now()}`,
        content: variables.content,
        messageType: variables.messageType || 'TEXT',
        createdAt: new Date().toISOString(),
        isRead: true,
        authorUser: { id: 'current-user', name: 'Moi' }, // Utilisateur actuel
        conversationId: variables.conversationId,
      };
      
      queryClient.setQueryData(['messages', variables.conversationId], (oldData: { data: Message[]; meta: { page: number; limit: number; total: number; totalPages: number } } | undefined) => {
        if (!oldData) return { data: [optimisticMessage], meta: { page: 1, limit: 50, total: 1, totalPages: 1 } };
        return {
          ...oldData,
          data: [...oldData.data, optimisticMessage]
        };
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
      queryClient.setQueryData(['messages', variables.conversationId], (oldData: { data: Message[]; meta: { page: number; limit: number; total: number; totalPages: number } } | undefined) => {
        if (!oldData) return { data: [newMessage], meta: { page: 1, limit: 50, total: 1, totalPages: 1 } };
        
        // Remplacer le message temporaire par le vrai
        const updatedData = oldData.data.map(msg => 
          msg.id.toString().startsWith('temp-') && msg.content === variables.content 
            ? newMessage 
            : msg
        );
        
        return {
          ...oldData,
          data: updatedData
        };
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
      queryClient.setQueryData(['messages', conversationId], (oldData: { data: Message[]; meta: { page: number; limit: number; total: number; totalPages: number } } | undefined) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          data: oldData.data.map((message: Message) => ({
            ...message,
            isRead: true
          }))
        };
      });
      
      // Invalider les conversations et stats
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({ queryKey: ['message-stats'] });
    },
  });
};
