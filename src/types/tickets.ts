/**
 * 🎫 TYPES TYPESCRIPT POUR LE SYSTÈME DE TICKETS
 * Définition complète des interfaces pour les tickets de support
 */

// Énumérations pour les tickets
export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type TicketCategory = 
  | 'PRODUCT_QUALITY' 
  | 'DELIVERY' 
  | 'CUSTOMER_SERVICE' 
  | 'BILLING' 
  | 'FOOD_SAFETY'
  | 'OTHER';

// Interface pour les catégories de tickets (service API)
export interface TicketCategoryAPI {
  id: string;
  name: string;
  description?: string;
  entity_status: 'ACTIVE' | 'INACTIVE';
  created_at: string;
  updated_at: string;
}

// Interface pour un ticket complet (selon les vraies données API)
export interface Ticket {
  id: string;
  code: string; // Code du ticket (ex: "LIV-00001")
  status: TicketStatus;
  priority: TicketPriority;
  
  // Relations avec objets complets
  customer: TicketCustomer;
  assignee?: TicketAssignee | null;
  participants: any[]; // À définir si nécessaire
  messages: TicketMessage[];
  order?: TicketOrder;
  category: TicketCategoryObject;
  
  // Métadonnées
  createdAt: string;
  updatedAt?: string;
}

// Interface pour les clients dans les tickets (selon API)
export interface TicketCustomer {
  id: string;
  name: string;
  first_name: string;
  last_name: string;
  email?: string | null;
  image?: string;
}

// Interface pour les agents assignés
export interface TicketAssignee {
  id: string;
  name: string;
  email: string;
  role: string;
  image?: string;
}

// Interface pour les messages de tickets
export interface TicketMessage {
  id: string;
  ticketId: string;
  authorUserId?: string | null;
  authorCustomerId?: string | null;
  body: string;
  meta: string;
  createdAt: string;
  isRead: boolean;
  internal: boolean;
}

// Interface pour les commandes liées
export interface TicketOrder {
  id: string;
  reference: string;
}

// Interface pour les catégories de tickets (objet complet)
export interface TicketCategoryObject {
  id: string;
  name: string;
}

// Interface pour la conversation liée
export interface TicketConversation {
  id: string;
  unreadNumber: number;
  createdAt: string;
}

// Interface pour le restaurant lié
export interface TicketRestaurant {
  id: string;
  name: string;
  image?: string;
}

// Interface pour les actions sur les tickets
export interface TicketAction {
  id: string;
  ticketId: string;
  userId: string;
  action: 'CREATED' | 'ASSIGNED' | 'STATUS_CHANGED' | 'PRIORITY_CHANGED' | 'RESOLVED' | 'COMMENTED';
  details?: Record<string, any>;
  createdAt: string;
  
  // Objets liés
  user?: TicketAssignee;
}

// Interface pour les commentaires sur les tickets
export interface TicketComment {
  id: string;
  ticketId: string;
  userId: string;
  content: string;
  isInternal: boolean; // true = note interne, false = visible au client
  createdAt: string;
  updatedAt: string;
  
  // Objets liés
  user?: TicketAssignee;
}

// Types pour les réponses API paginées
export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    limit: number;
    page: number;
    total: number;
    totalPages: number;
  };
}

export type TicketsResponse = PaginatedResponse<Ticket>;
export type TicketActionsResponse = PaginatedResponse<TicketAction>;
export type TicketCommentsResponse = PaginatedResponse<TicketComment>;

// Interface pour la création d'un ticket
export interface CreateTicketRequest {
  title: string;
  description?: string;
  priority: TicketPriority;
  category: TicketCategory;
  clientId: string;
  assignedToId?: string;
  conversationId?: string;
  restaurantId?: string;
}

// Interface pour la mise à jour d'un ticket
export interface UpdateTicketRequest {
  title?: string;
  description?: string;
  status?: TicketStatus;
  priority?: TicketPriority;
  category?: TicketCategory;
  assignedToId?: string;
}

// Interface pour l'escalation d'une conversation en ticket
export interface EscalateConversationRequest {
  conversationId: string;
  title: string;
  priority: TicketPriority;
  category: TicketCategory;
  assignedToId?: string;
  description?: string;
}

// Interface pour les statistiques des tickets
export interface TicketStats {
  total: number;
  open: number;
  inProgress: number;
  resolved: number;
  closed: number;
  
  // Par priorité
  urgent: number;
  high: number;
  medium: number;
  low: number;
  
  // Métriques de performance
  averageResponseTime: number; // en minutes
  averageResolutionTime: number; // en minutes
  satisfactionScore?: number; // 0-10
}

// Interface pour les filtres de tickets
export interface TicketFilters {
  status?: TicketStatus[];
  priority?: TicketPriority[];
  category?: TicketCategory[];
  assignedToId?: string[];
  clientId?: string;
  restaurantId?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

// Interface pour le tri des tickets
export interface TicketSort {
  field: 'createdAt' | 'updatedAt' | 'priority' | 'status' | 'title';
  direction: 'asc' | 'desc';
}

// Constantes utiles
export const TICKET_STATUS_LABELS: Record<TicketStatus, string> = {
  OPEN: 'Ouvert',
  IN_PROGRESS: 'En cours',
  RESOLVED: 'Résolu',
  CLOSED: 'Fermé'
};

export const TICKET_PRIORITY_LABELS: Record<TicketPriority, string> = {
  LOW: 'Faible',
  MEDIUM: 'Moyen',
  HIGH: 'Élevé',
  URGENT: 'Urgent'
};

export const TICKET_CATEGORY_LABELS: Record<TicketCategory, string> = {
  PRODUCT_QUALITY: 'Qualité produit',
  DELIVERY: 'Livraison',
  CUSTOMER_SERVICE: 'Service client',
  BILLING: 'Facturation',
  FOOD_SAFETY: 'Sécurité alimentaire',
  OTHER: 'Autre'
};
