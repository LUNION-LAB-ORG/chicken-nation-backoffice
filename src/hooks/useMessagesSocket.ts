import { useEffect, useRef, useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { io, Socket } from 'socket.io-client';
import { SOCKET_URL } from '../../socket';
import { NotificationAPI } from '@/services/notificationService';

interface SocketMessageData {
  conversationId?: string;
  messageId?: string;
  userId?: string;
  [key: string]: unknown;
}

interface UseMessagesSocketProps {
  conversationId?: string | null;
  userId?: string;
  enabled?: boolean;
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
}: UseMessagesSocketProps): UseMessagesSocketReturn => {
  const [socketConnected, setSocketConnected] = useState(false);
  const queryClient = useQueryClient();
  const socketRef = useRef<Socket | null>(null);

  // Fonction pour rafraîchir les messages de la conversation courante
  const refetchMessages = useCallback(() => {
    if (conversationId) {
      console.log(`🔄 [useMessagesSocket] Invalidating messages for conversation ${conversationId}`);
      queryClient.invalidateQueries({
        queryKey: ['messages', conversationId],
        exact: false,
      });
    }
  }, [conversationId, queryClient]);

  // Fonction pour rafraîchir la liste des conversations
  const refetchConversations = useCallback(() => {
    console.log('🔄 [useMessagesSocket] Invalidating conversations');
    queryClient.invalidateQueries({
      queryKey: ['conversations'],
      exact: false,
    });
  }, [queryClient]);

  // Gestionnaire pour les nouveaux messages
  const handleNewMessage = useCallback((data: SocketMessageData) => {
    console.log('📨 [useMessagesSocket] New message received:', data);
    
    // Invalider les messages de la conversation concernée
    if (data.conversationId) {
      console.log(`🔄 [useMessagesSocket] Invalidating messages for conversation: ${data.conversationId}`);
      queryClient.invalidateQueries({
        queryKey: ['messages', data.conversationId],
      });
      
      // Force refetch pour être sûr
      queryClient.refetchQueries({
        queryKey: ['messages', data.conversationId],
      });
    }
    
    // Invalider la liste des conversations pour mettre à jour les previews
    console.log('🔄 [useMessagesSocket] Invalidating conversations list');
    refetchConversations();
    
    // Invalider les stats des messages
    queryClient.invalidateQueries({
      queryKey: ['message-stats'],
    });
  }, [queryClient, refetchConversations]);

  // Gestionnaire pour les messages mis à jour
  const handleMessageUpdated = useCallback((data: SocketMessageData) => {
    console.log('📝 [useMessagesSocket] Message updated:', data);
    handleNewMessage(data); // Même logique que pour un nouveau message
  }, [handleNewMessage]);

  // Gestionnaire pour les conversations mises à jour
  const handleConversationUpdated = useCallback((data: SocketMessageData) => {
    console.log('💬 [useMessagesSocket] Conversation updated:', data);
    refetchConversations();
  }, [refetchConversations]);

  // Gestionnaire pour les messages lus
  const handleMessagesRead = useCallback((data: SocketMessageData) => {
    console.log('👁️ [useMessagesSocket] Messages marked as read:', data);
    
    if (data.conversationId) {
      queryClient.invalidateQueries({
        queryKey: ['messages', data.conversationId],
      });
    }
    
    refetchConversations();
  }, [queryClient, refetchConversations]);

  useEffect(() => {
    if (!enabled || !userId) return;

    console.log('🔌 [useMessagesSocket] Connecting to socket...');
    
    // Créer la connexion socket
    const socket = io(SOCKET_URL, {
      query: {
        token: NotificationAPI.getToken(),
        type: "user",
        userId: userId
      },
    });

    socketRef.current = socket;

    // Événements de connexion
    socket.on('connect', () => {
      console.log('✅ [useMessagesSocket] Socket connected');
      setSocketConnected(true);
    });

    socket.on('disconnect', () => {
      console.log('❌ [useMessagesSocket] Socket disconnected');
      setSocketConnected(false);
    });

    // Événements de messages - On écoute tous les événements possibles
    socket.on('message:new', handleNewMessage);
    socket.on('message:created', handleNewMessage);
    socket.on('message:updated', handleMessageUpdated);
    socket.on('message:read', handleMessagesRead);
    socket.on('new_message', handleNewMessage); // Alternative naming
    socket.on('message_created', handleNewMessage); // Alternative naming
    socket.on('message_updated', handleMessageUpdated); // Alternative naming
    
    // Événements de conversations
    socket.on('conversation:updated', handleConversationUpdated);
    socket.on('conversation:new', handleConversationUpdated);
    socket.on('conversation_updated', handleConversationUpdated); // Alternative naming
    
    // Log tous les événements pour débugger
    socket.onAny((eventName, ...args) => {
      console.log(`🔊 [useMessagesSocket] Received event: ${eventName}`, args);
    });

    // Cleanup
    return () => {
      console.log('🧹 [useMessagesSocket] Cleaning up socket connection');
      socket.off('connect');
      socket.off('disconnect');
      socket.off('message:new', handleNewMessage);
      socket.off('message:created', handleNewMessage);
      socket.off('message:updated', handleMessageUpdated);
      socket.off('message:read', handleMessagesRead);
      socket.off('new_message', handleNewMessage);
      socket.off('message_created', handleNewMessage);
      socket.off('message_updated', handleMessageUpdated);
      socket.off('conversation:updated', handleConversationUpdated);
      socket.off('conversation:new', handleConversationUpdated);
      socket.off('conversation_updated', handleConversationUpdated);
      socket.offAny(); // Remove all listeners
      socket.disconnect();
      socketRef.current = null;
      setSocketConnected(false);
    };
  }, [enabled, userId, handleNewMessage, handleMessageUpdated, handleMessagesRead, handleConversationUpdated]);

  return {
    socketConnected,
    refetchMessages,
    refetchConversations,
  };
};
