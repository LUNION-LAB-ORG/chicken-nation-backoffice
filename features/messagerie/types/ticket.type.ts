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
  body: string;
  meta?: any;
  isRead: boolean;
  internal: boolean;
  createdAt: string;
  authorUser?: ITicketAssigne | null;
  authorCustomer?: ITicketClient | null;
}

export interface ITicket {
  id: string;
  code: string;
  subject?: string;
  status: TicketStatut;
  priority: TicketPriorite;
  customer?: ITicketClient | null;
  assignee?: ITicketAssigne | null;
  participants?: { userId: string }[];
  messages: ITicketMessage[];
  order?: ITicketCommande | null;
  category?: ITicketCategorie | null;
  createdAt: string;
  updatedAt: string;
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
