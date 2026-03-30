import { apiRequest } from './api';
import {
  Ticket,
  TicketMessage,
  TicketStatus,
  TicketPriority,
  TicketCategory as TicketCategoryEnum,
  CreateTicketRequest,
  UpdateTicketRequest,
  TicketFilters,
  TicketsResponse,
  PaginatedResponse
} from '@/types/tickets';

// ✅ Récupérer tous les tickets avec filtres et pagination
export const getTickets = async (filters: TicketFilters = {}): Promise<TicketsResponse> => {
  try {
    const {
      status,
      priority,
      category,
      assignedToId,
      clientId,
      restaurantId,
      dateFrom,
      dateTo,
      search
    } = filters;

    // Construire les paramètres de requête
    const queryParams = new URLSearchParams();

    // Ajouter les filtres optionnels
    if (status && status.length > 0) {
      status.forEach(s => queryParams.append('status', s));
    }
    if (priority && priority.length > 0) {
      priority.forEach(p => queryParams.append('priority', p));
    }
    if (category && category.length > 0) {
      category.forEach(c => queryParams.append('category', c));
    }
    if (assignedToId && assignedToId.length > 0) {
      assignedToId.forEach(id => queryParams.append('assignedToId', id));
    }
    if (clientId) queryParams.append('clientId', clientId);
    if (restaurantId) queryParams.append('restaurantId', restaurantId);
    if (dateFrom) queryParams.append('dateFrom', dateFrom);
    if (dateTo) queryParams.append('dateTo', dateTo);
    if (search) queryParams.append('search', search);

    const response = await apiRequest<TicketsResponse>(
      `/tickets?${queryParams}`,
      'GET'
    );

    return response;
  } catch (error) {
    console.error('❌ [getTickets] Erreur:', error);
    throw error;
  }
};

// ✅ Récupérer un ticket par son ID
export const getTicketById = async (id: string): Promise<Ticket> => {
  try {
    const response = await apiRequest<Ticket>(`/tickets/${id}`, 'GET');
    return response;
  } catch (error) {
    console.error('❌ [getTicketById] Erreur:', error);
    throw error;
  }
};

// ✅ Créer un nouveau ticket
export const createTicket = async (data: CreateTicketRequest): Promise<Ticket> => {
  try {
    console.log('🚀 [createTicket] Données reçues:', data);

    // Mapper les champs selon l'API Swagger
    const apiData = {
      subject: data.title,
      status: 'Ouvert', // Statut par défaut
      priority: data.priority,
      categoryId: data.category,
      source: 'Dashboard', // Source par défaut
      customerId: data.clientId,
      assigneeId: data.assignedToId || undefined,
      fromConversationId: data.conversationId || undefined,
      orderId: undefined, // Pas utilisé pour l'instant
      description: data.description || undefined, // Au cas où l'API l'accepte
    };

    console.log('🚀 [createTicket] Données mappées pour l\'API:', apiData);
    console.log('🚀 [createTicket] Structure JSON:', JSON.stringify(apiData, null, 2));

    const response = await apiRequest<Ticket>('/tickets', 'POST', apiData);
    console.log('✅ [createTicket] Réponse reçue:', response);
    return response;
  } catch (error) {
    console.error('❌ [createTicket] Erreur complète:', error);

    // Essayer de récupérer plus de détails sur l'erreur
    if (error instanceof Error) {
      console.error('❌ [createTicket] Message d\'erreur:', error.message);
      console.error('❌ [createTicket] Stack:', error.stack);
    }

    throw error;
  }
};

// ✅ Mettre à jour un ticket
export const updateTicket = async (id: string, data: UpdateTicketRequest): Promise<Ticket> => {
  try {
    const response = await apiRequest<Ticket>(`/tickets/${id}`, 'PATCH', data);
    return response;
  } catch (error) {
    console.error('❌ [updateTicket] Erreur:', error);
    throw error;
  }
};

// ✅ Supprimer un ticket
export const deleteTicket = async (id: string): Promise<void> => {
  try {
    await apiRequest<void>(`/tickets/${id}`, 'DELETE');
  } catch (error) {
    console.error('❌ [deleteTicket] Erreur:', error);
    throw error;
  }
};

// ✅ Mettre à jour le statut d'un ticket
export const updateTicketStatus = async (id: string, status: TicketStatus): Promise<Ticket> => {
  try {
    const response = await apiRequest<Ticket>(`/tickets/${id}`, 'PATCH', { status });
    return response;
  } catch (error) {
    console.error('❌ [updateTicketStatus] Erreur:', error);
    throw error;
  }
};

// ✅ Mettre à jour la priorité d'un ticket
export const updateTicketPriority = async (id: string, priority: TicketPriority): Promise<Ticket> => {
  try {
    const response = await apiRequest<Ticket>(`/tickets/${id}`, 'PATCH', { priority });
    return response;
  } catch (error) {
    console.error('❌ [updateTicketPriority] Erreur:', error);
    throw error;
  }
};

// ✅ Assigner un ticket à un agent
export const assignTicket = async (id: string, assignedToId: string): Promise<Ticket> => {
  try {
    const response = await apiRequest<Ticket>(`/tickets/${id}/assign`, 'PATCH', { assignedToId });
    return response;
  } catch (error) {
    console.error('❌ [assignTicket] Erreur:', error);
    throw error;
  }
};

// ✅ Escalader une conversation en ticket
export const escalateConversationToTicket = async (data: {
  conversationId: string;
  title: string;
  priority: TicketPriority;
  category: TicketCategoryEnum;
  assignedToId?: string;
  description?: string;
}): Promise<Ticket> => {
  try {
    const response = await apiRequest<Ticket>('/tickets/escalate', 'POST', data);
    return response;
  } catch (error) {
    console.error('❌ [escalateConversationToTicket] Erreur:', error);
    throw error;
  }
};

// ✅ Obtenir les statistiques des tickets
export const getTicketStats = async (): Promise<{
  total: number;
  open: number;
  inProgress: number;
  resolved: number;
  closed: number;
  high: number;
  medium: number;
  low: number;
  averageResponseTime: number;
  averageResolutionTime: number;
  satisfactionScore?: number;
}> => {
  try {
    const response = await apiRequest<{
      total: number;
      open: number;
      inProgress: number;
      resolved: number;
      closed: number;
      high: number;
      medium: number;
      low: number;
      averageResponseTime: number;
      averageResolutionTime: number;
      satisfactionScore?: number;
    }>('/tickets/stats', 'GET');

    return response;
  } catch (error) {
    console.error('❌ [getTicketStats] Erreur:', error);
    // Retourner des stats par défaut en cas d'erreur
    return {
      total: 0,
      open: 0,
      inProgress: 0,
      resolved: 0,
      closed: 0,
      high: 0,
      medium: 0,
      low: 0,
      averageResponseTime: 0,
      averageResolutionTime: 0,
    };
  }
};
/**

 * 📨 GESTION DES MESSAGES DE TICKETS
 */

// Envoyer un message dans un ticket
export const sendTicketMessage = async (ticketId: string, messageData: {
  body: string;
  internal: boolean;
  authorId: string;
  meta?: string;
}): Promise<TicketMessage> => {
  try {
    const payload = {
      body: messageData.body,
      ticketId: ticketId,
      internal: messageData.internal,
      authorId: messageData.authorId,
      authorType: 'user', // Toujours 'user' dans le dashboard
      meta: messageData.meta || 'dashboard'
    };

    const response = await apiRequest<TicketMessage>(`/tickets/${ticketId}/messages`, 'POST', payload);

    return response;
  } catch (error) {
    console.error('❌ [sendTicketMessage] Erreur:', error);
    throw error;
  }
};

// Assigner l'utilisateur actuel au ticket
export const assignTicketToCurrentUser = async (ticketId: string, assigneeId: string): Promise<void> => {
  console.log('🎯 [assignTicketToCurrentUser] Attribution du ticket:', ticketId, 'à l\'utilisateur:', assigneeId);
  console.log('🔍 [assignTicketToCurrentUser] Types:', {
    ticketIdType: typeof ticketId,
    assigneeIdType: typeof assigneeId,
    assigneeIdValue: assigneeId,
    assigneeIdLength: assigneeId?.length
  });

  if (!assigneeId || assigneeId.trim() === '') {
    console.error('❌ [assignTicketToCurrentUser] assigneeId est vide ou undefined');
    throw new Error('assigneeId est requis');
  }

  const payload = { assigneeId };
  console.log('📦 [assignTicketToCurrentUser] Payload:', payload);

  try {
    await apiRequest(`/tickets/${ticketId}/assign`, 'POST', payload);

    console.log('✅ [assignTicketToCurrentUser] Ticket assigné avec succès');
  } catch (error) {
    console.error('❌ [assignTicketToCurrentUser] Erreur:', error);
    throw error;
  }
};