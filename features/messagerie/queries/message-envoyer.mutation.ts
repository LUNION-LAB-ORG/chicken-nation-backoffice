import { useMutation, useQueryClient } from '@tanstack/react-query';
import { conversationAPI } from '../apis/conversation.api';
import { conversationKeyQuery, messageKeyQuery, statsMessagesKeyQuery } from './index.query';
import type { ICitationMessage, IMentionMessage, IMessage } from '../types/conversation.type';

interface VariablesEnvoi {
  conversationId: string;
  body: string;
  image?: File;
  previewUrl?: string;
  audio?: File;
  audioDurationMs?: number;
  audioPreviewUrl?: string;
  /** Message auquel on répond. */
  replyToId?: string;
  /** Citation construite localement, affichée sur le message optimiste. */
  replyTo?: ICitationMessage | null;
  /** Collègues mentionnés, dont le « @Nom » figure dans le texte. */
  mentionUserIds?: string[];
  /** Mêmes mentions avec leur libellé, pour surligner le message optimiste. */
  mentions?: IMentionMessage[];
}

export const useEnvoyerMessageMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      conversationId,
      body,
      image,
      audio,
      audioDurationMs,
      replyToId,
      mentionUserIds,
    }: VariablesEnvoi) =>
      conversationAPI.envoyerMessage(conversationId, {
        body,
        image,
        audio,
        audioDurationMs,
        replyToId,
        mentionUserIds,
      }),

    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: messageKeyQuery(variables.conversationId) });
      const previous = queryClient.getQueryData(messageKeyQuery(variables.conversationId));

      /**
       * Identifiant PROPRE à cet envoi. C'est lui, et non le texte, qui permet
       * de retrouver le message optimiste quand le serveur répond : deux « OK »
       * envoyés coup sur coup en réponse à deux messages différents se
       * confondaient quand on comparait les corps.
       */
      const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

      const optimistic: Partial<IMessage> = {
        id: tempId,
        body: variables.body,
        createdAt: new Date().toISOString(),
        /**
         * ⚠️ FAUX au départ, et c'est volontaire.
         *
         * Ce champ dit « le destinataire a ouvert la conversation ». Le forcer
         * à vrai sur un message optimiste afficherait une coche de lecture
         * avant même que le message soit parti, ce qui est exactement le
         * contraire de ce qu'un accusé doit garantir.
         */
        isRead: false,
        // Aperçu local (object URL) de la pièce jointe en cours d'envoi, pour
        // que la bulle apparaisse immédiatement au lieu d'attendre le stockage.
        meta:
          variables.previewUrl || variables.audioPreviewUrl
            ? {
                ...(variables.previewUrl ? { imageUrl: variables.previewUrl } : {}),
                ...(variables.audioPreviewUrl
                  ? {
                      audioUrl: variables.audioPreviewUrl,
                      audioDurationMs: variables.audioDurationMs ?? null,
                    }
                  : {}),
              }
            : undefined,
        // Citation et mentions posées tout de suite : sans elles, la bulle
        // apparaîtrait nue puis se compléterait au retour du serveur.
        replyTo: variables.replyTo ?? null,
        mentions: variables.mentions ?? [],
        authorUser: { id: 'current-user', name: 'Moi', email: '' },
      };

      queryClient.setQueryData(messageKeyQuery(variables.conversationId), (old: any) => {
        if (old?.pages) {
          const pages = [...old.pages];
          if (pages.length === 0) {
            pages.push({ data: [optimistic], meta: { page: 1, limit: 100, total: 1, totalPages: 1 } });
          } else {
            const last = { ...pages[pages.length - 1] };
            last.data = [...(last.data || []), optimistic];
            pages[pages.length - 1] = last;
          }
          return { ...old, pages };
        }
        return old;
      });

      return { previous, tempId };
    },

    /**
     * Échec : on retire le SEUL message optimiste, par son identifiant.
     *
     * Remettre la photo du cache prise avant l'envoi effaçait aussi tout ce qui
     * était arrivé entre-temps : pages plus anciennes chargées pour atteindre
     * un message cité, message retiré en direct, réactions.
     */
    onError: (_err, variables, context) => {
      const tempId = context?.tempId;
      if (!tempId) {
        if (context?.previous) {
          queryClient.setQueryData(messageKeyQuery(variables.conversationId), context.previous);
        }
        return;
      }
      queryClient.setQueryData(messageKeyQuery(variables.conversationId), (old: any) => {
        if (!old?.pages) return old;
        return {
          ...old,
          pages: old.pages.map((page: any) => ({
            ...page,
            data: page.data?.filter((msg: any) => msg?.id !== tempId) || [],
          })),
        };
      });
    },

    onSuccess: (newMessage, variables, context) => {
      const tempId = context?.tempId;
      queryClient.setQueryData(messageKeyQuery(variables.conversationId), (old: any) => {
        if (old?.pages) {
          const pages = old.pages.map((page: any) => ({
            ...page,
            data: page.data?.map((msg: any) => (tempId && msg.id === tempId ? newMessage : msg)) || [],
          }));
          return { ...old, pages };
        }
        return old;
      });

      queryClient.invalidateQueries({ queryKey: conversationKeyQuery() });
      queryClient.invalidateQueries({ queryKey: statsMessagesKeyQuery() });
    },

    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({ queryKey: messageKeyQuery(variables.conversationId) });
    },
  });
};
