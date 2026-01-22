import { PaginatedResponse } from '../../types';
import { apiRequest } from './api';

// Types pour les catégories de tickets
export interface TicketCategory {
  id: string;
  name: string;
  description?: string;
  status: 'ACTIVE' | 'INACTIVE';
  created_at: string;
  updated_at: string;
}

export interface CreateTicketCategoryRequest {
  name: string;
  description?: string;
}

export interface UpdateTicketCategoryRequest {
  name?: string;
  description?: string;
}

export interface AgentAssignment {
  agentId: string;
  categoryId: string;
}

export interface TicketCategoryFilters {
  page?: number;
  limit?: number;
  status?: 'ACTIVE' | 'INACTIVE';
  sort?: 'asc' | 'desc';
  orderBy?: string;
  search?: string;
}

// ✅ Récupérer toutes les catégories avec filtres et pagination
export const getTicketCategories = async (filters: TicketCategoryFilters = {}): Promise<PaginatedResponse<TicketCategory>> => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      sort = 'desc',
      orderBy = 'created_at',
      search
    } = filters;

    // Construire les paramètres de requête
    const queryParams = new URLSearchParams({
      page: String(page),
      limit: String(limit),
      sort,
      orderBy
    });

    // Ajouter les filtres optionnels
    if (status) queryParams.append('status', status);
    if (search) queryParams.append('search', search);

    const url = `/categories-ticket?${queryParams}`;
    console.log('🔍 [getTicketCategories] Requête vers:', url);

    const response = await apiRequest<PaginatedResponse<TicketCategory>>(
      url, 
      'GET',
      undefined,
      false // Pas d'authentification requise pour la liste
    );
    
    console.log('📋 [getTicketCategories] Catégories récupérées:', response);
    return response;
  } catch (error) {
    console.error('❌ [getTicketCategories] Erreur:', error);
    throw error;
  }
};

// ✅ Récupérer une catégorie par son ID
export const getTicketCategoryById = async (id: string): Promise<TicketCategory> => {
  try {
    const response = await apiRequest<TicketCategory>(`/categories-ticket/${id}`, 'GET');
    return response;
  } catch (error) {
    console.error('❌ [getTicketCategoryById] Erreur:', error);
    throw error;
  }
};

// ✅ Créer une nouvelle catégorie
export const createTicketCategory = async (data: CreateTicketCategoryRequest): Promise<TicketCategory> => {
  try {
    console.log('🚀 [createTicketCategory] Envoi de la requête:', data);
    const response = await apiRequest<TicketCategory>('/categories-ticket', 'POST', data);
    console.log('✅ [createTicketCategory] Réponse reçue:', response);
    return response;
  } catch (error) {
    console.error('❌ [createTicketCategory] Erreur:', error);
    throw error;
  }
};

// ✅ Mettre à jour une catégorie
export const updateTicketCategory = async (id: string, data: UpdateTicketCategoryRequest): Promise<TicketCategory> => {
  try {
    const response = await apiRequest<TicketCategory>(`/categories-ticket/${id}`, 'PATCH', data);
    return response;
  } catch (error) {
    console.error('❌ [updateTicketCategory] Erreur:', error);
    throw error;
  }
};

// ✅ Supprimer une catégorie
export const deleteTicketCategory = async (id: string): Promise<void> => {
  try {
    await apiRequest<void>(`/categories-ticket/${id}`, 'DELETE');
  } catch (error) {
    console.error('❌ [deleteTicketCategory] Erreur:', error);
    throw error;
  }
};

// ✅ Attribuer un agent à une catégorie
export const assignAgentToCategory = async (assignment: AgentAssignment): Promise<void> => {
  try {
    await apiRequest<void>('/categories-ticket/agents', 'POST', assignment);
  } catch (error) {
    console.error('❌ [assignAgentToCategory] Erreur:', error);
    throw error;
  }
};

// ✅ Désassigner un agent d'une catégorie
export const unassignAgentFromCategory = async (assignment: AgentAssignment): Promise<void> => {
  try {
    await apiRequest<void>('/categories-ticket/agents/remove', 'POST', assignment);
  } catch (error) {
    console.error('❌ [unassignAgentFromCategory] Erreur:', error);
    throw error;
  }
};