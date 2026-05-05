export enum TicketStatut {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  RESOLVED = 'RESOLVED',
  CLOSED = 'CLOSED',
}

export enum TicketPriorite {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
}

export interface ITicketClient {
  id: string;
  name: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  image?: string | null;
}

/**
 * Demandeur livreur d'un ticket (P-chat livreur ↔ support).
 * Mutuellement exclusif avec `customer` côté API.
 */
export interface ITicketLivreur {
  id: string;
  name: string;
  first_name?: string | null;
  last_name?: string | null;
  phone?: string | null;
  image?: string | null;
}

export interface ITicketAssigne {
  id: string;
  name?: string;
  fullname?: string;
  email?: string;
  image?: string | null;
}

export interface ITicketCommande {
  id: string;
  code?: string;
  restaurantId?: string;
}

export interface ITicketCategorie {
  id: string;
  name: string;
  description?: string | null;
}

export interface ITicketMessage {
  id: string;
  ticketId: string;
  authorUserId?: string | null;
  authorCustomerId?: string | null;
  /** P-chat livreur : auteur livreur. Exclusif avec authorUser/authorCustomer. */
  authorDelivererId?: string | null;
  body: string;
  meta?: any;
  isRead: boolean;
  internal: boolean;
  createdAt: string;
  authorUser?: ITicketAssigne | null;
  authorCustomer?: ITicketClient | null;
  /** Données enrichies du livreur auteur. */
  authorDeliverer?: ITicketLivreur | null;
}

export interface ITicket {
  id: string;
  code: string;
  subject?: string;
  status: TicketStatut;
  priority: TicketPriorite;
  customer?: ITicketClient | null;
  /** P-chat livreur : demandeur livreur. Exclusif avec customer. */
  deliverer?: ITicketLivreur | null;
  assignee?: ITicketAssigne | null;
  participants?: { userId: string }[];
  messages: ITicketMessage[];
  order?: ITicketCommande | null;
  category?: ITicketCategorie | null;
  createdAt: string;
  updatedAt: string;
  unreadCount?: number;
}

/**
 * Type d'origine d'un ticket — utilisé pour filtrer la liste backoffice
 * (tabs "Tous · Clients · Livreurs").
 */
export type TicketSource = 'CUSTOMER' | 'DELIVERER';

/** Helper pour identifier l'origine d'un ticket. */
export function getTicketSource(ticket: ITicket): TicketSource | null {
  if (ticket.deliverer) return 'DELIVERER';
  if (ticket.customer) return 'CUSTOMER';
  return null;
}

export interface ITicketStats {
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
  unreadTickets?: number;
}

export interface ICreerTicketDTO {
  title: string;
  priority: TicketPriorite;
  category?: string;
  clientId?: string;
  assignedToId?: string;
  conversationId?: string;
  description?: string;
}

export interface IModifierTicketDTO {
  status?: TicketStatut;
  priority?: TicketPriorite;
  assigneeId?: string;
}

export interface IFiltresTicket {
  status?: TicketStatut[];
  priority?: TicketPriorite[];
  category?: string[];
  assignedToId?: string[];
  clientId?: string;
  restaurantId?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

export interface IEnvoyerMessageTicketDTO {
  body: string;
  internal: boolean;
  authorId: string;
  meta?: string;
}
