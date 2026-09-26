import { useQuery } from '@tanstack/react-query';
import { conversationAPI } from '../apis/conversation.api';
import { conversationKeyQuery } from './index.query';

/**
 * Une conversation seule, lue par son identifiant.
 *
 * Repli de la conversation ouverte quand elle n'est pas dans les pages déjà
 * chargées de la liste : lien profond, clic sur la cloche pour un vieux groupe.
 * Sans lui, l'en-tête affichait « Conversation non trouvée » et la liste des
 * personnes à mentionner restait vide.
 *
 * La clé commence par `conversation` : toute invalidation de la liste (socket,
 * renommage, ajout de membre) la rafraîchit aussi.
 */
export const useConversationDetailQuery = (conversationId: string | null, enabled = true) =>
  useQuery({
    queryKey: conversationKeyQuery('detail', conversationId ?? ''),
    queryFn: () => conversationAPI.obtenirConversation(conversationId as string),
    enabled: enabled && !!conversationId,
    staleTime: 2 * 60 * 1000,
  });
