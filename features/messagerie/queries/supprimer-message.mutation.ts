import { useMutation, useQueryClient } from '@tanstack/react-query';
import { conversationAPI } from '../apis/conversation.api';
import { ticketAPI } from '../apis/ticket.api';
import { messageKeyQuery, ticketKeyQuery, conversationKeyQuery } from './index.query';

/**
 * RETIRER un message envoyé par erreur.
 *
 * Pas d'optimisme ici, contrairement aux réactions. Une suppression peut être
 * refusée — ce n'est pas votre message, ou vous n'êtes pas administrateur — et
 * faire disparaître un message avant d'avoir la réponse donnerait l'illusion
 * d'un retrait qui n'a pas eu lieu. On attend le serveur, qui renvoie le
 * message déjà nettoyé, et on le remplace.
 *
 * La liste des conversations EST invalidée, elle : son aperçu affiche le
 * dernier message, qui vient peut-être d'être retiré.
 */
const retoucher = (ancien: unknown, messageId: string, remplacant: unknown) => {
  if (!ancien || typeof ancien !== 'object') return ancien;
  type Ligne = { id: string };
  const donnee = ancien as { pages?: { data?: Ligne[] }[]; data?: Ligne[]; messages?: Ligne[] };
  const maj = (liste?: Ligne[]) =>
    liste?.map((m) => (m.id === messageId ? { ...m, ...(remplacant as object) } : m));

  if (Array.isArray(donnee.pages)) {
    return { ...donnee, pages: donnee.pages.map((p) => ({ ...p, data: maj(p.data) })) };
  }
  if (Array.isArray(donnee.data)) return { ...donnee, data: maj(donnee.data) };
  if (Array.isArray(donnee.messages)) return { ...donnee, messages: maj(donnee.messages) };
  return ancien;
};

export const useSupprimerMessageMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ conversationId, messageId }: { conversationId: string; messageId: string }) =>
      conversationAPI.supprimerMessage(conversationId, messageId),
    onSuccess: (message, { conversationId }) => {
      queryClient.setQueryData(messageKeyQuery(conversationId), (ancien: unknown) =>
        retoucher(ancien, message.id, message),
      );
      // L'aperçu de la liste montre le dernier message : il vient de changer.
      queryClient.invalidateQueries({ queryKey: conversationKeyQuery() });
    },
  });
};

export const useSupprimerMessageTicketMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ ticketId, messageId }: { ticketId: string; messageId: string }) =>
      ticketAPI.supprimerMessage(ticketId, messageId),
    onSuccess: (message, { ticketId }) => {
      queryClient.setQueryData(ticketKeyQuery('detail', ticketId), (ancien: unknown) =>
        retoucher(ancien, message.id, message),
      );
    },
  });
};
