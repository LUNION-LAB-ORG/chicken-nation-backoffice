import { useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { conversationKeyQuery, messageKeyQuery, statsMessagesKeyQuery, ticketKeyQuery } from '../queries/index.query';
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

    /**
     * RÉACTIONS, en direct.
     *
     * On retouche le message concerné dans le cache plutôt que d'invalider :
     * une invalidation recharge toute la page de messages, fait clignoter le
     * fil et, sur la liste des conversations, ferait remuer des compteurs de
     * non-lus qu'un pouce n'a aucune raison de toucher.
     *
     * La charge utile est déjà calculée POUR MOI par le serveur : `mine` y est
     * juste, il n'y a rien à recalculer ici.
     */
    const retoucherReactions = (
      queryKey: unknown[],
      messageId: string,
      reactions: unknown,
    ) => {
      queryClient.setQueryData(queryKey, (ancien: any) => {
        if (!ancien || typeof ancien !== 'object') return ancien;
        const maj = (liste?: any[]) =>
          liste?.map((m) => (m?.id === messageId ? { ...m, reactions } : m));
        if (Array.isArray(ancien.pages)) {
          return { ...ancien, pages: ancien.pages.map((p: any) => ({ ...p, data: maj(p?.data) })) };
        }
        if (Array.isArray(ancien.data)) return { ...ancien, data: maj(ancien.data) };
        if (Array.isArray(ancien.messages)) return { ...ancien, messages: maj(ancien.messages) };
        return ancien;
      });
    };

    const onReactions = (data: any) => {
      if (!data?.conversationId || !data?.messageId) return;
      retoucherReactions(messageKeyQuery(data.conversationId), data.messageId, data.reactions);
    };

    const onReactionsTicket = (data: any) => {
      if (!data?.ticketId || !data?.messageId) return;
      retoucherReactions(ticketKeyQuery('detail', data.ticketId), data.messageId, data.reactions);
    };

    socket.on('message:reactions', onReactions);
    socket.on('ticket_message:reactions', onReactionsTicket);
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
      socket.off('message:reactions', onReactions);
      socket.off('ticket_message:reactions', onReactionsTicket);
      releaseSocket();
    };
  }, [enabled, currentUserId, queryClient, invalidateConversations, invalidateMessages]);
};
