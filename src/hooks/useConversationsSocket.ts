import { useMessagesSocket } from '@/hooks/useMessagesSocket';

// Hook simple qui utilise useMessagesSocket pour la compatibilité
export const useConversationsSocket = () => {
  const { refetchConversations } = useMessagesSocket({
    enabled: true,
  });

  return {
    refreshConversations: refetchConversations,
  };
};