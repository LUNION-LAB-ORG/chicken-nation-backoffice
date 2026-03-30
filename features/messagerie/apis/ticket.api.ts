import { apiRequest } from '../../../src/services/api';
import type { ITicket, ITicketMessage, ITicketStats, ICreerTicketDTO, IModifierTicketDTO, IFiltresTicket, IEnvoyerMessageTicketDTO } from '../types/ticket.type';

interface PaginatedResponse<T> {
  data: T[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

const BASE = '/tickets';

export const ticketAPI = {
  obtenirTous: (filtres: IFiltresTicket = {}): Promise<PaginatedResponse<ITicket>> => {
    const params = new URLSearchParams();
    if (filtres.status?.length) filtres.status.forEach(s => params.append('status', s));
    if (filtres.priority?.length) filtres.priority.forEach(p => params.append('priority', p));
    if (filtres.category?.length) filtres.category.forEach(c => params.append('category', c));
    if (filtres.assignedToId?.length) filtres.assignedToId.forEach(id => params.append('assignedToId', id));
    if (filtres.clientId) params.append('clientId', filtres.clientId);
    if (filtres.restaurantId) params.append('restaurantId', filtres.restaurantId);
    if (filtres.dateFrom) params.append('dateFrom', filtres.dateFrom);
    if (filtres.dateTo) params.append('dateTo', filtres.dateTo);
    if (filtres.search) params.append('search', filtres.search);
    return apiRequest<PaginatedResponse<ITicket>>(`${BASE}?${params}`, 'GET');
  },

  obtenirParId: (id: string): Promise<ITicket> =>
    apiRequest<ITicket>(`${BASE}/${id}`, 'GET'),

  creer: (data: ICreerTicketDTO): Promise<ITicket> => {
    const apiData = {
      subject: data.title,
      status: 'Ouvert',
      priority: data.priority,
      categoryId: data.category,
      source: 'Dashboard',
      customerId: data.clientId,
      assigneeId: data.assignedToId || undefined,
      fromConversationId: data.conversationId || undefined,
      description: data.description || undefined,
    };
    return apiRequest<ITicket>(BASE, 'POST', apiData);
  },

  modifier: (id: string, data: IModifierTicketDTO): Promise<ITicket> =>
    apiRequest<ITicket>(`${BASE}/${id}`, 'PATCH', data),

  supprimer: (id: string): Promise<void> =>
    apiRequest<void>(`${BASE}/${id}`, 'DELETE'),

  modifierStatut: (id: string, status: string): Promise<ITicket> =>
    apiRequest<ITicket>(`${BASE}/${id}`, 'PATCH', { status }),

  modifierPriorite: (id: string, priority: string): Promise<ITicket> =>
    apiRequest<ITicket>(`${BASE}/${id}`, 'PATCH', { priority }),

  assigner: (id: string, assigneeId: string): Promise<void> =>
    apiRequest(`${BASE}/${id}/assign`, 'POST', { assigneeId }),

  escalader: (data: { conversationId: string; title: string; priority: string; category?: string }): Promise<ITicket> =>
    apiRequest<ITicket>(`${BASE}/escalate`, 'POST', data),

  envoyerMessage: (ticketId: string, data: IEnvoyerMessageTicketDTO): Promise<ITicketMessage> =>
    apiRequest<ITicketMessage>(`${BASE}/${ticketId}/messages`, 'POST', {
      body: data.body,
      ticketId,
      internal: data.internal,
      authorId: data.authorId,
      authorType: 'user',
      meta: data.meta || 'dashboard',
    }),

  obtenirStats: async (): Promise<ITicketStats> => {
    try {
      return await apiRequest<ITicketStats>(`${BASE}/stats`, 'GET');
    } catch {
      return {
        total: 0, open: 0, inProgress: 0, resolved: 0, closed: 0,
        high: 0, medium: 0, low: 0, averageResponseTime: 0, averageResolutionTime: 0,
      };
    }
  },
};
