import { useMutation, useQueryClient } from '@tanstack/react-query';
import { conversationAPI } from '../apis/conversation.api';
import { ticketAPI } from '../apis/ticket.api';
import { messageKeyQuery, ticketKeyQuery } from './index.query';
import type { IReaction } from '../types/conversation.type';

/**
 * RÉACTIONS : mutations optimistes, et retouche CHIRURGICALE du cache.
 *
 * Deux exigences se rejoignent ici. Une réaction doit répondre au clic, sans
 * aller-retour perceptible : d'où l'optimisme. Et elle ne doit RIEN déranger
 * d'autre : surtout pas la liste des conversations ni les compteurs de non-lus,
 * qu'un pouce n'a aucune raison de faire bouger. On ne déclenche donc aucune
 * invalidation, on modifie le seul message concerné dans la page qui le
 * contient.
 */

/** Applique localement ce que le serveur fera : poser, remplacer, ou retirer. */
const basculerLocalement = (reactions: IReaction[] | undefined, emoji: string): IReaction[] => {
  const courantes = reactions ?? [];
  const mienne = courantes.find((r) => r.mine);

  // Reposer le même emoji le retire.
  if (mienne?.emoji === emoji) {
    return courantes
      .map((r) => (r.emoji === emoji ? { ...r, count: r.count - 1, mine: false } : r))
      .filter((r) => r.count > 0);
  }

  // Retirer l'ancienne, s'il y en avait une, puis poser la nouvelle.
  const sansLaMienne = mienne
    ? courantes
        .map((r) => (r.emoji === mienne.emoji ? { ...r, count: r.count - 1, mine: false } : r))
        .filter((r) => r.count > 0)
    : courantes;

  const deja = sansLaMienne.find((r) => r.emoji === emoji);
  return deja
    ? sansLaMienne.map((r) => (r.emoji === emoji ? { ...r, count: r.count + 1, mine: true } : r))
    : [...sansLaMienne, { emoji, count: 1, mine: true }];
};

/**
 * Modifie UN message, où qu'il se trouve, sans toucher au reste.
 *
 * Trois formes de cache cohabitent dans ce module : la liste infinie des
 * messages d'une conversation (`pages[].data`), une liste simple (`data`), et
 * le détail d'un ticket qui embarque ses messages (`messages`). Plutôt que
 * d'écrire trois mutations, on reconnaît la forme et on ne remplace que la
 * ligne concernée : rien d'autre ne change d'identité, donc rien d'autre ne se
 * redessine.
 */
const retoucherMessage = (
  ancien: unknown,
  messageId: string,
  transformer: (m: { reactions?: IReaction[] }) => { reactions?: IReaction[] },
) => {
  if (!ancien || typeof ancien !== 'object') return ancien;
  type Ligne = { id: string; reactions?: IReaction[] };
  const donnee = ancien as {
    pages?: { data?: Ligne[] }[];
    data?: Ligne[];
    messages?: Ligne[];
  };

  const majListe = (liste?: Ligne[]) =>
    liste?.map((m) => (m.id === messageId ? { ...m, ...transformer(m) } : m));

  if (Array.isArray(donnee.pages)) {
    return { ...donnee, pages: donnee.pages.map((p) => ({ ...p, data: majListe(p.data) })) };
  }
  if (Array.isArray(donnee.data)) {
    return { ...donnee, data: majListe(donnee.data) };
  }
  if (Array.isArray(donnee.messages)) {
    return { ...donnee, messages: majListe(donnee.messages) };
  }
  return ancien;
};

const useBascule = (
  cle: (id: string) => unknown[],
  appel: (parentId: string, messageId: string, emoji: string) => Promise<{ messageId: string; reactions: IReaction[] }>,
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ parentId, messageId, emoji }: { parentId: string; messageId: string; emoji: string }) =>
      appel(parentId, messageId, emoji),

    onMutate: async ({ parentId, messageId, emoji }) => {
      const queryKey = cle(parentId);
      // On annule un éventuel rechargement en vol : sinon sa réponse, partie
      // avant notre clic, écraserait la pastille qu'on vient d'allumer.
      await queryClient.cancelQueries({ queryKey });
      const precedent = queryClient.getQueryData(queryKey);

      queryClient.setQueryData(queryKey, (ancien: unknown) =>
        retoucherMessage(ancien, messageId, (m) => ({
          reactions: basculerLocalement(m.reactions, emoji),
        })),
      );

      return { queryKey, precedent };
    },

    onError: (_e, _v, contexte) => {
      // Le serveur a refusé : on remet exactement ce qui était affiché avant.
      if (contexte?.precedent !== undefined) {
        queryClient.setQueryData(contexte.queryKey, contexte.precedent);
      }
    },

    onSuccess: (reponse, { parentId }) => {
      // Le serveur fait foi : son agrégat remplace notre estimation, ce qui
      // rattrape les réactions posées par d'autres entre-temps.
      queryClient.setQueryData(cle(parentId), (ancien: unknown) =>
        retoucherMessage(ancien, reponse.messageId, () => ({ reactions: reponse.reactions })),
      );
    },
  });
};

/** Réaction sur un message de CONVERSATION. */
export const useBasculerReactionMessageMutation = () =>
  useBascule(
    (conversationId) => messageKeyQuery(conversationId),
    (conversationId, messageId, emoji) =>
      conversationAPI.basculerReaction(conversationId, messageId, emoji),
  );

/** Réaction sur un message de TICKET. */
export const useBasculerReactionTicketMutation = () =>
  useBascule(
    // Les messages d'un ticket vivent dans son DÉTAIL, pas dans une liste à part.
    (ticketId) => ticketKeyQuery('detail', ticketId),
    (ticketId, messageId, emoji) => ticketAPI.basculerReaction(ticketId, messageId, emoji),
  );
