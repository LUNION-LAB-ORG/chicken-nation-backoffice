import { create } from 'zustand';
import {
  getTickets,
  getTicketById,
  createTicket,
  updateTicket,
  deleteTicket,
  updateTicketStatus,
  assignTicket,
  escalateConversationToTicket,
  getTicketStats
} from '@/services/ticketService';
import {
  getTicketCategories,
  createTicketCategory,
  updateTicketCategory,
  deleteTicketCategory
} from '@/services/ticketCategoryService';
import {
  Ticket,
  TicketStatus,
  TicketPriority,
  CreateTicketRequest,
  UpdateTicketRequest,
  TicketFilters
} from '@/types/tickets';
import { TicketCategory } from '@/services/ticketCategoryService';

interface TicketState {
  // État des données
  tickets: Ticket[];
  currentTicket: Ticket | null;
  categories: TicketCategory[];
  stats: {
    total: number;
    open: number;
    inProgress: number;
    resolved: number;
    closed: number;
    urgent: number;
    high: number;
    medium: number;
    low: number;
    averageResponseTime: number;
    averageResolutionTime: number;
    satisfactionScore?: number;
  } | null;
  
  // États de chargement
  isLoading: boolean;
  isLoadingTicket: boolean;
  isLoadingCategories: boolean;
  isCreating: boolean;
  isUpdating: boolean;
  
  // Erreurs
  error: string | null;
  
  // Filtres actifs
  activeFilters: TicketFilters;
  
  // Actions pour les tickets
  fetchTickets: (filters?: TicketFilters) => Promise<void>;
  fetchTicketById: (id: string) => Promise<void>;
  createNewTicket: (data: CreateTicketRequest) => Promise<void>;
  updateExistingTicket: (id: string, data: UpdateTicketRequest) => Promise<void>;
  deleteExistingTicket: (id: string) => Promise<void>;
  updateTicketStatusAction: (id: string, status: TicketStatus) => Promise<void>;
  assignTicketAction: (id: string, assignedToId: string) => Promise<void>;
  escalateConversation: (data: {
    conversationId: string;
    title: string;
    priority: TicketPriority;
    category: any;
    assignedToId?: string;
    description?: string;
  }) => Promise<void>;
  
  // Actions pour les catégories
  fetchCategories: () => Promise<void>;
  createCategory: (data: { name: string; description?: string }) => Promise<void>;
  updateCategory: (id: string, data: { name?: string; description?: string }) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  
  // Actions pour les statistiques
  fetchStats: () => Promise<void>;
  
  // Utilitaires
  setCurrentTicket: (ticket: Ticket | null) => void;
  setActiveFilters: (filters: TicketFilters) => void;
  clearError: () => void;
  reset: () => void;
  
  // Actions WebSocket
  addTicket: (ticket: Ticket) => void;
  updateTicketInStore: (ticket: Ticket) => void;
  removeTicketFromStore: (ticketId: string) => void;
}

export const useTicketStore = create<TicketState>()((set, get) => ({
  // État initial
  tickets: [],
  currentTicket: null,
  categories: [],
  stats: null,
  isLoading: false,
  isLoadingTicket: false,
  isLoadingCategories: false,
  isCreating: false,
  isUpdating: false,
  error: null,
  activeFilters: {},

  // ✅ Récupérer tous les tickets
  fetchTickets: async (filters: TicketFilters = {}) => {
    try {
      set({ isLoading: true, error: null, activeFilters: filters });
      
      const response = await getTickets(filters);
      
      set({ 
        tickets: response.data,
        isLoading: false 
      });
      
      console.log('✅ [TicketStore] Tickets récupérés:', response.data.length);
    } catch (error) {
      console.error('❌ [TicketStore] Erreur lors du chargement des tickets:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Erreur lors du chargement des tickets',
        isLoading: false 
      });
    }
  },

  // ✅ Récupérer un ticket par ID
  fetchTicketById: async (id: string) => {
    try {
      set({ isLoadingTicket: true, error: null });
      
      const ticket = await getTicketById(id);
      
      set({ 
        currentTicket: ticket,
        isLoadingTicket: false 
      });
      
      console.log('✅ [TicketStore] Ticket récupéré:', ticket);
    } catch (error) {
      console.error('❌ [TicketStore] Erreur lors du chargement du ticket:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Erreur lors du chargement du ticket',
        isLoadingTicket: false 
      });
    }
  },

  // ✅ Créer un nouveau ticket
  createNewTicket: async (data: CreateTicketRequest) => {
    try {
      set({ isCreating: true, error: null });
      
      const newTicket = await createTicket(data);
      
      // Ajouter le ticket à la liste
      const currentTickets = get().tickets;
      set({ 
        tickets: [newTicket, ...currentTickets],
        currentTicket: newTicket,
        isCreating: false 
      });
      
      console.log('✅ [TicketStore] Ticket créé:', newTicket);
    } catch (error) {
      console.error('❌ [TicketStore] Erreur lors de la création du ticket:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Erreur lors de la création du ticket',
        isCreating: false 
      });
    }
  },

  // ✅ Mettre à jour un ticket
  updateExistingTicket: async (id: string, data: UpdateTicketRequest) => {
    try {
      set({ isUpdating: true, error: null });
      
      const updatedTicket = await updateTicket(id, data);
      
      // Mettre à jour dans la liste
      const tickets = get().tickets;
      const updatedTickets = tickets.map(ticket => 
        ticket.id === id ? updatedTicket : ticket
      );
      
      set({ 
        tickets: updatedTickets,
        currentTicket: get().currentTicket?.id === id ? updatedTicket : get().currentTicket,
        isUpdating: false 
      });
      
      console.log('✅ [TicketStore] Ticket mis à jour:', updatedTicket);
    } catch (error) {
      console.error('❌ [TicketStore] Erreur lors de la mise à jour du ticket:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Erreur lors de la mise à jour du ticket',
        isUpdating: false 
      });
    }
  },

  // ✅ Supprimer un ticket
  deleteExistingTicket: async (id: string) => {
    try {
      set({ error: null });
      
      await deleteTicket(id);
      
      // Supprimer de la liste
      const tickets = get().tickets;
      const filteredTickets = tickets.filter(ticket => ticket.id !== id);
      
      set({ 
        tickets: filteredTickets,
        currentTicket: get().currentTicket?.id === id ? null : get().currentTicket
      });
      
      console.log('✅ [TicketStore] Ticket supprimé');
    } catch (error) {
      console.error('❌ [TicketStore] Erreur lors de la suppression du ticket:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Erreur lors de la suppression du ticket'
      });
    }
  },

  // ✅ Mettre à jour le statut d'un ticket
  updateTicketStatusAction: async (id: string, status: TicketStatus) => {
    try {
      set({ error: null });
      
      const updatedTicket = await updateTicketStatus(id, status);
      
      // Mettre à jour dans la liste
      const tickets = get().tickets;
      const updatedTickets = tickets.map(ticket => 
        ticket.id === id ? updatedTicket : ticket
      );
      
      set({ 
        tickets: updatedTickets,
        currentTicket: get().currentTicket?.id === id ? updatedTicket : get().currentTicket
      });
      
      console.log('✅ [TicketStore] Statut du ticket mis à jour:', updatedTicket);
    } catch (error) {
      console.error('❌ [TicketStore] Erreur lors de la mise à jour du statut:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Erreur lors de la mise à jour du statut'
      });
    }
  },

  // ✅ Assigner un ticket
  assignTicketAction: async (id: string, assignedToId: string) => {
    try {
      set({ error: null });
      
      const updatedTicket = await assignTicket(id, assignedToId);
      
      // Mettre à jour dans la liste
      const tickets = get().tickets;
      const updatedTickets = tickets.map(ticket => 
        ticket.id === id ? updatedTicket : ticket
      );
      
      set({ 
        tickets: updatedTickets,
        currentTicket: get().currentTicket?.id === id ? updatedTicket : get().currentTicket
      });
      
      console.log('✅ [TicketStore] Ticket assigné:', updatedTicket);
    } catch (error) {
      console.error('❌ [TicketStore] Erreur lors de l\'assignation:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Erreur lors de l\'assignation'
      });
    }
  },

  // ✅ Escalader une conversation en ticket
  escalateConversation: async (data) => {
    try {
      set({ isCreating: true, error: null });
      
      const newTicket = await escalateConversationToTicket(data);
      
      // Ajouter le ticket à la liste
      const currentTickets = get().tickets;
      set({ 
        tickets: [newTicket, ...currentTickets],
        currentTicket: newTicket,
        isCreating: false 
      });
      
      console.log('✅ [TicketStore] Conversation escaladée en ticket:', newTicket);
    } catch (error) {
      console.error('❌ [TicketStore] Erreur lors de l\'escalation:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Erreur lors de l\'escalation',
        isCreating: false 
      });
    }
  },

  // ✅ Récupérer les catégories
  fetchCategories: async () => {
    try {
      set({ isLoadingCategories: true, error: null });
      
      const response = await getTicketCategories();
      
      set({ 
        categories: response.data,
        isLoadingCategories: false 
      });
      
      console.log('✅ [TicketStore] Catégories récupérées:', response.data.length);
    } catch (error) {
      console.error('❌ [TicketStore] Erreur lors du chargement des catégories:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Erreur lors du chargement des catégories',
        isLoadingCategories: false 
      });
    }
  },

  // ✅ Créer une catégorie
  createCategory: async (data) => {
    try {
      set({ error: null });
      
      const newCategory = await createTicketCategory(data);
      
      // Ajouter à la liste
      const currentCategories = get().categories;
      set({ 
        categories: [newCategory, ...currentCategories]
      });
      
      console.log('✅ [TicketStore] Catégorie créée:', newCategory);
    } catch (error) {
      console.error('❌ [TicketStore] Erreur lors de la création de la catégorie:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Erreur lors de la création de la catégorie'
      });
    }
  },

  // ✅ Mettre à jour une catégorie
  updateCategory: async (id: string, data) => {
    try {
      set({ error: null });
      
      const updatedCategory = await updateTicketCategory(id, data);
      
      // Mettre à jour dans la liste
      const categories = get().categories;
      const updatedCategories = categories.map(category => 
        category.id === id ? updatedCategory : category
      );
      
      set({ categories: updatedCategories });
      
      console.log('✅ [TicketStore] Catégorie mise à jour:', updatedCategory);
    } catch (error) {
      console.error('❌ [TicketStore] Erreur lors de la mise à jour de la catégorie:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Erreur lors de la mise à jour de la catégorie'
      });
    }
  },

  // ✅ Supprimer une catégorie
  deleteCategory: async (id: string) => {
    try {
      set({ error: null });
      
      await deleteTicketCategory(id);
      
      // Supprimer de la liste
      const categories = get().categories;
      const filteredCategories = categories.filter(category => category.id !== id);
      
      set({ categories: filteredCategories });
      
      console.log('✅ [TicketStore] Catégorie supprimée');
    } catch (error) {
      console.error('❌ [TicketStore] Erreur lors de la suppression de la catégorie:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Erreur lors de la suppression de la catégorie'
      });
    }
  },

  // ✅ Récupérer les statistiques
  fetchStats: async () => {
    try {
      const stats = await getTicketStats();
      set({ stats });
      console.log('✅ [TicketStore] Statistiques récupérées:', stats);
    } catch (error) {
      console.error('❌ [TicketStore] Erreur lors du chargement des statistiques:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Erreur lors du chargement des statistiques'
      });
    }
  },

  // ✅ Actions WebSocket
  addTicket: (ticket: Ticket) => {
    const tickets = get().tickets;
    const ticketExists = tickets.some(t => t.id === ticket.id);
    
    if (!ticketExists) {
      set({ tickets: [ticket, ...tickets] });
      console.log('✅ [TicketStore] Nouveau ticket ajouté via WebSocket:', ticket);
    }
  },

  updateTicketInStore: (ticket: Ticket) => {
    const tickets = get().tickets;
    const updatedTickets = tickets.map(t => t.id === ticket.id ? ticket : t);
    
    set({ 
      tickets: updatedTickets,
      currentTicket: get().currentTicket?.id === ticket.id ? ticket : get().currentTicket
    });
    
    console.log('✅ [TicketStore] Ticket mis à jour via WebSocket:', ticket);
  },

  removeTicketFromStore: (ticketId: string) => {
    const tickets = get().tickets;
    const filteredTickets = tickets.filter(t => t.id !== ticketId);
    
    set({ 
      tickets: filteredTickets,
      currentTicket: get().currentTicket?.id === ticketId ? null : get().currentTicket
    });
    
    console.log('✅ [TicketStore] Ticket supprimé via WebSocket:', ticketId);
  },

  // ✅ Utilitaires
  setCurrentTicket: (ticket: Ticket | null) => {
    set({ currentTicket: ticket });
  },

  setActiveFilters: (filters: TicketFilters) => {
    set({ activeFilters: filters });
  },

  clearError: () => {
    set({ error: null });
  },

  reset: () => {
    set({
      tickets: [],
      currentTicket: null,
      categories: [],
      stats: null,
      isLoading: false,
      isLoadingTicket: false,
      isLoadingCategories: false,
      isCreating: false,
      isUpdating: false,
      error: null,
      activeFilters: {},
    });
  }
}));