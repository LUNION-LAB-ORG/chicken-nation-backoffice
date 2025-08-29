import { useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { io } from 'socket.io-client';
import { SOCKET_URL } from '../../socket';
import { NotificationAPI } from '@/services/notificationService';

export const useConversationsSocket = () => {
  const queryClient = useQueryClient();

  const handleConversationUpdate = useCallback(() => {
 
    // Invalider et refetch les conversations
    queryClient.invalidateQueries({ queryKey: ['conversations'] });
  }, [queryClient]);

  const handleNewMessage = useCallback((data: { conversationId?: string; messageId?: string; [key: string]: unknown }) => {
  
    
    // Invalider les conversations pour mettre à jour le dernier message et le compteur non lu
    queryClient.invalidateQueries({ queryKey: ['conversations'] });
    
    // Si on a l'ID de la conversation, invalider aussi les messages
    if (data?.conversationId) {
      queryClient.invalidateQueries({ queryKey: ['messages', data.conversationId] });
    }
  }, [queryClient]);

  const handleConversationRead = useCallback((data: { conversationId?: string; [key: string]: unknown }) => {
    
    
    // Invalider les conversations pour mettre à jour les compteurs
    queryClient.invalidateQueries({ queryKey: ['conversations'] });
    
    // Invalider aussi les messages de cette conversation
    if (data?.conversationId) {
      queryClient.invalidateQueries({ queryKey: ['messages', data.conversationId] });
    }
  }, [queryClient]);

  useEffect(() => {
    // Créer une connexion socket authentifiée (comme pour les notifications)
    const socket = io(SOCKET_URL, {
      query: {
        token: NotificationAPI.getToken(),
        type: 'user',
      },
    });

    // Événements liés aux nouvelles conversations
    socket.on('conversation:new', handleConversationUpdate);
    socket.on('conversation:updated', handleConversationUpdate);

    // Événements liés aux nouveaux messages
    socket.on('message:new', handleNewMessage);
    socket.on('message:created', handleNewMessage);
    socket.on('new_message', handleNewMessage);

    // Événements liés à la lecture des messages
    socket.on('message:read', handleConversationRead);
    socket.on('conversation:read', handleConversationRead);

    // Log tous les événements pour debug
    socket.onAny((eventName, ...args) => {
      if (eventName.includes('conversation') || eventName.includes('message')) {
        console.log(`🎯 [useConversationsSocket] Événement WebSocket reçu: ${eventName}`, args);
      }
    });

    return () => {
      console.log('🔌 [useConversationsSocket] Déconnexion des événements WebSocket conversations');

      socket.off('conversation:new', handleConversationUpdate);
      socket.off('conversation:updated', handleConversationUpdate);
      socket.off('message:new', handleNewMessage);
      socket.off('message:created', handleNewMessage);
      socket.off('new_message', handleNewMessage);
      socket.off('message:read', handleConversationRead);
      socket.off('conversation:read', handleConversationRead);
  if ((socket as any).offAny) (socket as any).offAny();
  if ((socket as any).disconnect) (socket as any).disconnect();
    };
  }, [handleConversationUpdate, handleNewMessage, handleConversationRead]);

  return {
    // Fonctions utilitaires pour forcer le refresh si nécessaire
    refreshConversations: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
    refreshMessages: (conversationId: string) => {
      queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
    }
  };
};
