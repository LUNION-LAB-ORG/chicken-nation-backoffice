import { useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { conversationKeyQuery, messageKeyQuery, statsMessagesKeyQuery } from '../queries/index.query';
import { useAuthStore } from '../../users/hook/authStore';
import { acquireSocket, releaseSocket, shouldPlayOnce } from './sharedSocket';

interface UseMessagerieSocketSyncProps {
  conversationId?: string | null;
  enabled?: boolean;
}

/**
 * Synchronise l'Inbox en direct via le socket PARTAGÉ du backoffice.
 * Plusieurs montages simultanés sont sans danger : une seule connexion,
 * un seul son par message (garde shouldPlayOnce).
 */
export const useMessagerieSocketSync = ({
  enabled = true,
}: UseMessagerieSocketSyncProps = {}) => {
  const queryClient = useQueryClient();
  const currentUserId = useAuthStore((s) => s.user?.id);

  const invalidateConversations = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: conversationKeyQuery() });
    queryClient.invalidateQueries({ queryKey: statsMessagesKeyQuery() });
  }, [queryClient]);

  const invalidateMessages = useCallback((convId: string) => {
    queryClient.invalidateQueries({ queryKey: messageKeyQuery(convId) });
    invalidateConversations();
  }, [queryClient, invalidateConversations]);

  useEffect(() => {
    if (!enabled) return;

    const socket = acquireSocket();
    if (!socket) return;

    const audio = typeof window !== 'undefined' ? new Audio('/musics/message.mp3') : null;
    if (audio) audio.volume = 0.5;

    const onNewMessage = (message: any) => {
      const authorId = message?.authorUser?.id;
      const isOwnMessage = currentUserId && authorId === currentUserId;
      if (audio && !isOwnMessage && shouldPlayOnce(`msg:${message?.id}`)) {
        audio.currentTime = 0;
        audio.play().catch(() => {});
      }

      const msgConvId = message?.conversation?.id || message?.conversationId;
      if (msgConvId) {
        invalidateMessages(msgConvId);
      } else {
        invalidateConversations();
      }
    };

    const onMessagesRead = (data: any) => {
      const convId = data?.conversationId;
      if (convId) {
        queryClient.invalidateQueries({ queryKey: messageKeyQuery(convId) });
      }
      invalidateConversations();
    };

    const onNewConversation = () => invalidateConversations();

    socket.on('new:message', onNewMessage);
    socket.on('messages:read', onMessagesRead);
    socket.on('new:conversation', onNewConversation);

    return () => {
      socket.off('new:message', onNewMessage);
      socket.off('messages:read', onMessagesRead);
      socket.off('new:conversation', onNewConversation);
      releaseSocket();
    };
  }, [enabled, currentUserId, queryClient, invalidateConversations, invalidateMessages]);
};
