import { useMutation, useQueryClient } from '@tanstack/react-query';
import { conversationAPI } from '../apis/conversation.api';
import { conversationKeyQuery, statsMessagesKeyQuery } from './index.query';

/**
 * Gestion de la composition d'un groupe interne.
 *
 * Les trois opérations invalident les mêmes caches : la liste des
 * conversations, qui porte les participants et le nom du groupe, et les
 * statistiques, puisqu'entrer ou sortir d'un groupe change le nombre de
 * conversations non lues.
 */
const useInvalider = () => {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: conversationKeyQuery() });
    queryClient.invalidateQueries({ queryKey: statsMessagesKeyQuery() });
  };
};

export const useAjouterParticipantsMutation = () => {
  const invalider = useInvalider();
  return useMutation({
    mutationFn: ({ conversationId, userIds }: { conversationId: string; userIds: string[] }) =>
      conversationAPI.ajouterParticipants(conversationId, userIds),
    onSuccess: invalider,
  });
};

export const useRetirerParticipantMutation = () => {
  const invalider = useInvalider();
  return useMutation({
    mutationFn: ({ conversationId, userId }: { conversationId: string; userId: string }) =>
      conversationAPI.retirerParticipant(conversationId, userId),
    onSuccess: invalider,
  });
};

export const useRenommerGroupeMutation = () => {
  const invalider = useInvalider();
  return useMutation({
    mutationFn: ({ conversationId, subject }: { conversationId: string; subject: string }) =>
      conversationAPI.renommerGroupe(conversationId, subject),
    onSuccess: invalider,
  });
};
