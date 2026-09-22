import { useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { conversationKeyQuery, messageKeyQuery, statsMessagesKeyQuery } from '../queries/index.query';
import { useAuthStore } from '../../users/hook/authStore';
import { acquireSocket, releaseSocket, shouldPlayOnce } from './sharedSocket';

interface UseMessagerieSocketSyncProps {
  conversationId?: string | null;
  enabled?: boolean;
  /**
   * Appelé quand le serveur signale qu'on vient d'être retiré du groupe
   * actuellement ouvert. Sans ça, l'écran reste affiché, la zone de saisie
   * active, sur une conversation à laquelle on n'a plus accès.
   */
  onRetireDuGroupe?: () => void;
}

/**
 * Synchronise l'Inbox en direct via le socket PARTAGÉ du backoffice.
 * Plusieurs montages simultanés sont sans danger : une seule connexion,
 * un seul son par message (garde shouldPlayOnce).
 */
export const useMessagerieSocketSync = ({
  conversationId = null,
  enabled = true,
  onRetireDuGroupe,
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

    /**
     * La composition d'un GROUPE a bougé : quelqu'un y est entré, en est sorti,
     * ou le groupe a été renommé.
     *
     * Sans cette écoute, seul celui qui a cliqué voyait le changement, les
     * autres attendant leur prochain rechargement. Un membre qu'on vient de
     * retirer recevrait aussi l'évènement : l'invalidation fait disparaître la
     * conversation de sa liste, puisque le serveur ne la lui sert plus.
     */
    const onParticipantsChanged = (conversation: any) => {
      const convId = conversation?.id;
      if (convId) {
        queryClient.invalidateQueries({ queryKey: messageKeyQuery(convId) });
      }
      invalidateConversations();
    };

    /**
     * On vient d'être retiré d'un groupe. La charge utile ne porte que
     * l'identifiant, à dessein : le serveur ne nous renvoie plus le contenu
     * d'un groupe dont nous ne faisons plus partie.
     */
    const onRetire = (data: any) => {
      invalidateConversations();
      if (data?.conversationId && data.conversationId === conversationId) {
        onRetireDuGroupe?.();
      }
    };

    socket.on('new:message', onNewMessage);
    socket.on('messages:read', onMessagesRead);
    socket.on('new:conversation', onNewConversation);
    socket.on('conversation:participants', onParticipantsChanged);
    socket.on('conversation:retire', onRetire);

    return () => {
      socket.off('new:message', onNewMessage);
      socket.off('messages:read', onMessagesRead);
      socket.off('new:conversation', onNewConversation);
      socket.off('conversation:participants', onParticipantsChanged);
      socket.off('conversation:retire', onRetire);
      releaseSocket();
    };
  }, [enabled, currentUserId, queryClient, invalidateConversations, invalidateMessages]);
};
