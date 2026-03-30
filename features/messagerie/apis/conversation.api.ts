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

  envoyerMessage: (conversationId: string, body: string): Promise<IMessage> =>
    apiRequest<IMessage>(`${BASE}/${conversationId}/messages`, 'POST', { body }),

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
