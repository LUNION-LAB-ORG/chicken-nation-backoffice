import { useEffect, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { io, Socket } from 'socket.io-client';
import { NotificationAPI } from '../../../src/services/notificationService';
import { SOCKET_URL } from '../../../src/config';
import { conversationKeyQuery, messageKeyQuery, statsMessagesKeyQuery } from '../queries/index.query';
import { useAuthStore } from '../../users/hook/authStore';

interface UseMessagerieSocketSyncProps {
  conversationId?: string | null;
  enabled?: boolean;
}

export const useMessagerieSocketSync = ({
  conversationId,
  enabled = true,
}: UseMessagerieSocketSyncProps = {}) => {
  const queryClient = useQueryClient();
  const currentUserId = useAuthStore((s) => s.user?.id);
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

    const token = NotificationAPI.getToken();
    if (!token) {
      console.warn('[Socket] Pas de token d\'authentification, socket non connecté');
      return;
    }

    const socket = io(SOCKET_URL, {
      query: { token, type: 'user' },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
    });
    socketRef.current = socket;

    socket.on('connect_error', (err) => {
      console.warn('[Socket] Erreur de connexion:', err.message);
    });

    // Backend events: new:message, messages:read, new:conversation
    socket.on('new:message', (message: any) => {
      // Ne jouer le son que pour les messages reçus (pas ceux envoyés par soi-même)
      const authorId = message?.authorUser?.id;
      const isOwnMessage = currentUserId && authorId === currentUserId;
      if (audioRef.current && !isOwnMessage) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch((e) => console.warn('[Audio] Play failed:', e.message));
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
  }, [enabled, currentUserId, queryClient, invalidateConversations, invalidateMessages]);

  return { socket: socketRef.current };
};
