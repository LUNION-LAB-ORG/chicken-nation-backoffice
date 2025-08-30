import { useCallback } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useConversationsQuery } from '@/hooks/useConversationsQuery';
import { useMessagesSocket } from '@/hooks/useMessagesSocket';

interface UseMessagesSoundParams {
  disabledSound?: boolean;
}

export const useMessagesSound = ({
  disabledSound = false,
}: UseMessagesSoundParams = {}) => {
  const { user } = useAuthStore();

  // Récupérer les conversations via React Query
  const { data: conversationsData } = useConversationsQuery();

  const conversations = conversationsData?.data || [];
  const currentUserId = user?.id;

  // Fonction pour récupérer les messages lus depuis localStorage
  const getReadMessages = useCallback(() => {
    if (typeof window === 'undefined') return new Set();
    try {
      const stored = localStorage.getItem('readMessages');
      return new Set(stored ? JSON.parse(stored) : []);
    } catch {
      return new Set();
    }
  }, []);

  // Calculer les messages non lus en utilisant localStorage
  const unreadMessagesList = conversations
    .flatMap((c) => (c.messages || []).map((m) => ({ ...m, conversationId: c.id, customer: c.customer })))
    .filter((m) => {
      const readMessages = getReadMessages();
      const isNotReadInLocalStorage = !readMessages.has(m.id);
      const isFromCustomer = !!m.authorCustomer;
      const isFromOtherUser = !!m.authorUser && m.authorUser.id !== currentUserId;
      return isNotReadInLocalStorage && (isFromCustomer || isFromOtherUser);
    });

  const totalUnread = unreadMessagesList.length;

  // Utiliser le hook unifié avec le son activé
  useMessagesSocket({
    userId: currentUserId,
    enabled: true,
    playSound: !disabledSound,
  });

  return {
    hasUnreadMessages: totalUnread > 0,
    unreadMessagesCount: totalUnread,
  };
};