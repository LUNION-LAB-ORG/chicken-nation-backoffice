import { apiRequest } from '../../../src/services/api';
import type {
  IConversation,
  IMessage,
  IStatsMessages,
  ICreerConversationDTO,
  IPositionMessage,
} from '../types/conversation.type';

/** Ce qu'on envoie avec un message : texte, pièces jointes, réponse, mentions. */
export interface OptionsEnvoiMessage {
  body: string;
  image?: File;
  audio?: File;
  audioDurationMs?: number;
  /** Message auquel on répond (même conversation, vérifié par le serveur). */
  replyToId?: string;
  /** Collègues mentionnés. Le serveur ne retient que ceux dont « @Nom » figure dans le texte. */
  mentionUserIds?: string[];
}

interface PaginatedResponse<T> {
  data: T[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

const BASE = '/conversations';

export const conversationAPI = {
  obtenirTous: (page = 1, limit = 50): Promise<PaginatedResponse<IConversation>> =>
    apiRequest<PaginatedResponse<IConversation>>(`${BASE}?page=${page}&limit=${limit}`, 'GET'),

  obtenirMessages: (conversationId: string, page?: number, limit?: number): Promise<PaginatedResponse<IMessage>> => {
    const params = new URLSearchParams();
    if (page !== undefined) params.append('page', String(page));
    if (limit !== undefined) params.append('limit', String(limit));
    const qs = params.toString() ? `?${params.toString()}` : '';
    return apiRequest<PaginatedResponse<IMessage>>(`${BASE}/${conversationId}/messages${qs}`, 'GET');
  },

  /**
   * Texte seul (JSON), ou pièce jointe (multipart).
   *
   * Champs côté serveur : `image` et `audio`. Les fichiers partent vers le
   * stockage et reviennent dans `message.meta` sous `imageUrl` et `audioUrl`.
   *
   * ⚠️ `audioDurationMs` est envoyé par le navigateur car la durée réelle d'un
   * enregistrement en flux continu n'est pas toujours lisible dans le fichier
   * produit : certains navigateurs annoncent une durée infinie tant que le
   * fichier n'a pas été parcouru en entier.
   *
   * `replyToId` et `mentionUserIds` DOIVENT être déclarés côté serveur : le
   * filtre de validation y supprime en silence tout champ inconnu.
   */
  envoyerMessage: (conversationId: string, options: OptionsEnvoiMessage): Promise<IMessage> => {
    const { body, image, audio, audioDurationMs, replyToId } = options;
    const mentionUserIds = options.mentionUserIds?.filter(Boolean) ?? [];
    if (image || audio) {
      const formData = new FormData();
      formData.append('body', body);
      if (image) formData.append('image', image);
      if (audio) {
        formData.append('audio', audio);
        if (audioDurationMs) formData.append('audioDurationMs', String(Math.round(audioDurationMs)));
      }
      // Champs facultatifs ajoutés SEULEMENT s'ils sont renseignés : une chaîne
      // vide serait lue comme un identifiant invalide.
      if (replyToId) formData.append('replyToId', replyToId);
      // Un champ par identifiant : le serveur reconstitue la liste.
      for (const id of mentionUserIds) formData.append('mentionUserIds', id);
      return apiRequest<IMessage>(`${BASE}/${conversationId}/messages`, 'POST', formData);
    }
    return apiRequest<IMessage>(`${BASE}/${conversationId}/messages`, 'POST', {
      body,
      ...(replyToId ? { replyToId } : {}),
      ...(mentionUserIds.length > 0 ? { mentionUserIds } : {}),
    });
  },

  /**
   * Une conversation seule, avec ses participants. Sert de repli quand elle
   * n'est pas dans les pages déjà chargées de la liste (lien profond, cloche).
   * Le serveur répond vide si elle n'existe pas ou n'est pas accessible.
   */
  obtenirConversation: async (conversationId: string): Promise<IConversation | null> => {
    // Identifiant encodé : il peut venir d'un lien (cloche, courriel), et ne
    // doit pas pouvoir détourner le chemin de la requête.
    const conversation = await apiRequest<IConversation | null>(
      `${BASE}/${encodeURIComponent(conversationId)}`,
      'GET',
    );
    return conversation && typeof conversation === 'object' && 'id' in conversation ? conversation : null;
  },

  /**
   * Page du fil (1 = la plus récente) qui contient un message donné, pour
   * aller jusqu'à un message cité qui n'est pas encore chargé.
   */
  positionMessage: (conversationId: string, messageId: string, limit: number): Promise<IPositionMessage> =>
    apiRequest<IPositionMessage>(
      `${BASE}/${encodeURIComponent(conversationId)}/messages/${encodeURIComponent(messageId)}/position?limit=${limit}`,
      'GET',
    ),

  marquerLu: (conversationId: string): Promise<void> =>
    apiRequest(`${BASE}/${conversationId}/messages/read`, 'POST'),

  obtenirStats: async (): Promise<IStatsMessages> => {
    try {
      return await apiRequest<IStatsMessages>(`${BASE}/stats`, 'GET');
    } catch {
      return { total_conversations: 0, unread_conversations: 0, total_messages: 0, unread_messages: 0 };
    }
  },

  creer: (dto: ICreerConversationDTO): Promise<IConversation> =>
    apiRequest<IConversation>(BASE, 'POST', dto),

  // ─── Gestion d'un groupe interne ───
  // Le serveur applique les règles : il faut être membre, et être responsable
  // pour toucher aux autres. Retirer son propre identifiant = quitter le groupe.
  ajouterParticipants: (conversationId: string, userIds: string[]): Promise<IConversation> =>
    apiRequest<IConversation>(`${BASE}/${conversationId}/participants`, 'POST', {
      user_ids: userIds,
    }),

  retirerParticipant: (conversationId: string, userId: string): Promise<IConversation> =>
    apiRequest<IConversation>(`${BASE}/${conversationId}/participants/${userId}`, 'DELETE'),

  renommerGroupe: (conversationId: string, subject: string): Promise<IConversation> =>
    apiRequest<IConversation>(`${BASE}/${conversationId}/subject`, 'PATCH', { subject }),

  basculerAlertes: (conversationId: string, recevoir: boolean): Promise<IConversation> =>
    apiRequest<IConversation>(`${BASE}/${conversationId}/alerts`, 'PATCH', {
      receives_alerts: recevoir,
    }),

  /**
   * Pose, remplace ou retire une réaction. `PUT` : la requête décrit un état
   * voulu, la rejouer ne crée jamais de seconde réaction.
   */
  basculerReaction: (
    conversationId: string,
    messageId: string,
    emoji: string,
  ): Promise<{ messageId: string; reactions: { emoji: string; count: number; mine: boolean }[] }> =>
    apiRequest(`${BASE}/${conversationId}/messages/${messageId}/reactions`, 'PUT', { emoji }),

  /**
   * Retire un message envoyé par erreur. Le serveur renvoie le message déjà
   * nettoyé : on n'a rien à masquer soi-même.
   */
  supprimerMessage: (conversationId: string, messageId: string): Promise<IMessage> =>
    apiRequest<IMessage>(`${BASE}/${conversationId}/messages/${messageId}`, 'DELETE'),

  archiver: (conversationId: string): Promise<void> =>
    apiRequest(`${BASE}/${conversationId}/archive`, 'POST'),

  fermer: (conversationId: string): Promise<void> =>
    apiRequest(`${BASE}/${conversationId}/close`, 'POST'),
};
