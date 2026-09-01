import { apiRequest } from '../../../src/services/api';
import type { IConversation, IMessage, IStatsMessages, ICreerConversationDTO } from '../types/conversation.type';

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
   */
  envoyerMessage: (
    conversationId: string,
    body: string,
    image?: File,
    audio?: File,
    audioDurationMs?: number,
  ): Promise<IMessage> => {
    if (image || audio) {
      const formData = new FormData();
      formData.append('body', body);
      if (image) formData.append('image', image);
      if (audio) {
        formData.append('audio', audio);
        if (audioDurationMs) formData.append('audioDurationMs', String(Math.round(audioDurationMs)));
      }
      return apiRequest<IMessage>(`${BASE}/${conversationId}/messages`, 'POST', formData);
    }
    return apiRequest<IMessage>(`${BASE}/${conversationId}/messages`, 'POST', { body });
  },

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

  archiver: (conversationId: string): Promise<void> =>
    apiRequest(`${BASE}/${conversationId}/archive`, 'POST'),

  fermer: (conversationId: string): Promise<void> =>
    apiRequest(`${BASE}/${conversationId}/close`, 'POST'),
};
