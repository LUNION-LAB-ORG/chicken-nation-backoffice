import { useEffect, useRef, useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { io, Socket } from 'socket.io-client';
import { SOCKET_URL } from '../../socket';
import { NotificationAPI } from '@/services/notificationService';

interface SocketMessageData {
  conversationId?: string;
  messageId?: string;
  userId?: string;
  authorCustomer?: any;
  authorUser?: { id: string };
  [key: string]: unknown;
}

interface UseMessagesSocketProps {
  conversationId?: string | null;
  userId?: string;
  enabled?: boolean;
  onNewMessage?: (data: SocketMessageData) => void;
  playSound?: boolean;
}

interface UseMessagesSocketReturn {
  socketConnected: boolean;
  refetchMessages: () => void;
  refetchConversations: () => void;
}

export const useMessagesSocket = ({
  conversationId,
  userId,
  enabled = true,
  onNewMessage,
  playSound = false,
}: UseMessagesSocketProps): UseMessagesSocketReturn => {
  const [socketConnected, setSocketConnected] = useState(false);
  const queryClient = useQueryClient();
  const socketRef = useRef<Socket | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Fonction pour rafraîchir les messages de la conversation courante
  const refetchMessages = useCallback(() => {
    if (conversationId) {
      queryClient.invalidateQueries({
        queryKey: ['messages', conversationId],
      });
    }
  }, [conversationId, queryClient]);

  // Fonction pour rafraîchir la liste des conversations
  const refetchConversations = useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: ['conversations'],
    });
  }, [queryClient]);

  // Gestionnaire pour les nouveaux messages
  const handleNewMessage = useCallback((data: SocketMessageData) => {
    console.log('🔄 [Socket] Nouveau message reçu:', data);

    // Jouer le son immédiatement si activé
    if (playSound && audioRef.current) {
      const message = Array.isArray(data) ? data[0] : data;
      if (message) {
        const isFromCustomer = !!message.authorCustomer;
        const isFromOtherUser = !!message.authorUser && message.authorUser.id !== userId;

        if (isFromCustomer || isFromOtherUser) {
          console.log('🔊 [Socket] Jouer le son pour nouveau message');
          audioRef.current.currentTime = 0;
          audioRef.current.play().catch((error) => {
            console.warn('Impossible de jouer le son:', error);
          });
        }
      }
    }

    // Callback personnalisé
    if (onNewMessage) {
      try {
        onNewMessage(data);
      } catch (err) {
        console.warn('Erreur onNewMessage callback', err);
      }
    }

    // Invalidation intelligente des queries (pas de refetch forcé)
    if (data.conversationId) {
      queryClient.invalidateQueries({
        queryKey: ['messages', data.conversationId],
      });
    }

    queryClient.invalidateQueries({
      queryKey: ['conversations'],
    });

    queryClient.invalidateQueries({
      queryKey: ['message-stats'],
    });
  }, [queryClient, onNewMessage, playSound, userId]);

  // Gestionnaire pour les messages lus
  const handleMessagesRead = useCallback((data: SocketMessageData) => {
    console.log('📖 [Socket] Messages marqués comme lus:', data);

    if (data.conversationId) {
      queryClient.invalidateQueries({
        queryKey: ['messages', data.conversationId],
      });
    }

    queryClient.invalidateQueries({
      queryKey: ['conversations'],
    });
  }, [queryClient]);

  useEffect(() => {
    if (!enabled) return;

    console.log('🔌 [Socket] Connexion WebSocket...');

    // Initialiser l'audio si nécessaire
    if (playSound && !audioRef.current && typeof window !== 'undefined') {
      audioRef.current = new Audio('/musics/message.mp3');
      audioRef.current.volume = 0.5;
    }

    const baseQuery: Record<string, string> = {
      token: NotificationAPI.getToken(),
      type: 'user',
    };
    const query = userId ? { ...baseQuery, userId } : baseQuery;

    const socket = io(SOCKET_URL, { query });
    socketRef.current = socket;

    // Événements de connexion
    socket.on('connect', () => {
      console.log('✅ [Socket] Connecté');
      setSocketConnected(true);
    });

    socket.on('disconnect', () => {
      console.log('❌ [Socket] Déconnecté');
      setSocketConnected(false);
    });

    // Événements de messages - Tous les formats possibles
    socket.on('message:new', handleNewMessage);
    socket.on('message:created', handleNewMessage);
    socket.on('new_message', handleNewMessage);
    socket.on('new:message', handleNewMessage);
    socket.on('message_created', handleNewMessage);
    socket.on('message:updated', handleNewMessage);
    socket.on('message_updated', handleNewMessage);

    // Événements de lecture
    socket.on('message:read', handleMessagesRead);
    socket.on('messages:read', handleMessagesRead);

    // Événements de conversations
    socket.on('conversation:updated', handleNewMessage);
    socket.on('conversation:new', handleNewMessage);
    socket.on('conversation_updated', handleNewMessage);

    return () => {
      console.log('🧹 [Socket] Nettoyage connexion');
      socket.offAny();
      socket.disconnect();
      socketRef.current = null;
      setSocketConnected(false);
    };
  }, [enabled, userId, handleNewMessage, handleMessagesRead, playSound]);

  return {
    socketConnected,
    refetchMessages,
    refetchConversations,
  };
};