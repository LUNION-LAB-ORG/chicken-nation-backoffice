import { useEffect, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { io, Socket } from 'socket.io-client';
import { NotificationAPI } from '../../../src/services/notificationService';
import { SOCKET_URL } from '../../../src/config';
import { conversationKeyQuery, messageKeyQuery, statsMessagesKeyQuery } from '../queries/index.query';

interface UseMessagerieSocketSyncProps {
  conversationId?: string | null;
  enabled?: boolean;
}

export const useMessagerieSocketSync = ({
  conversationId,
  enabled = true,
}: UseMessagerieSocketSyncProps = {}) => {
  const queryClient = useQueryClient();
  const socketRef = useRef<Socket | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

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

    if (!audioRef.current && typeof window !== 'undefined') {
      audioRef.current = new Audio('/musics/message.mp3');
      audioRef.current.volume = 0.5;
    }

    const socket = io(SOCKET_URL, {
      query: {
        token: NotificationAPI.getToken() || '',
        type: 'user',
      },
    });
    socketRef.current = socket;

    // Backend events: new:message, messages:read, new:conversation
    socket.on('new:message', (message: any) => {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(() => {});
      }

      const msgConvId = message?.conversation?.id || message?.conversationId;
      if (msgConvId) {
        invalidateMessages(msgConvId);
      } else {
        invalidateConversations();
      }
    });

    socket.on('messages:read', (data: any) => {
      const convId = data?.conversationId;
      if (convId) {
        queryClient.invalidateQueries({ queryKey: messageKeyQuery(convId) });
      }
      invalidateConversations();
    });

    socket.on('new:conversation', () => {
      invalidateConversations();
    });

    return () => {
      socket.offAny();
      socket.disconnect();
      socketRef.current = null;
    };
  }, [enabled, queryClient, invalidateConversations, invalidateMessages]);

  return { socket: socketRef.current };
};
