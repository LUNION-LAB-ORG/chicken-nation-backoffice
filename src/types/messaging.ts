// Types pour les auteurs de messages (Users du back-office)
export interface MessageAuthorUser {
  id: string;
  name: string;
  email: string;
  image?: string | null;
}

// Types pour les auteurs de messages (Customers/Clients)
export interface MessageAuthorCustomer {
  id: string;
  name: string;
  first_name: string;
  last_name: string;
  image?: string | null;
}

// Types pour les messages selon la nouvelle structure API
export interface Message {
  id: string;
  isRead: boolean;
  body: string;
  authorUser?: MessageAuthorUser | null;
  authorCustomer?: MessageAuthorCustomer | null;
  createdAt: string;
  updatedAt: string;
}

// Types pour les clients/customers
export interface Customer {
  id: string;
  first_name: string;
  last_name: string;
  image?: string;
  email?: string;
  phone?: string;
}

// Types pour les restaurants
export interface Restaurant {
  id: string;
  name: string;
  image?: string;
}

// Types pour les utilisateurs dans les conversations
export interface ConversationUser {
  id: string;
  fullName: string;
  image?: string | null;
  role: string;
}

// Types pour les conversations selon la nouvelle structure API
export interface Conversation {
  id: string;
  unreadNumber: number;
  customerId: string | null; // null pour les conversations internes
  createdAt: string;
  messages: Message[];
  restaurant?: Restaurant | null;
  customer: Customer | null; // null pour les conversations internes
  users: ConversationUser[]; // Utilisateurs participants à la conversation
}

export interface MessageStats {
  total_conversations: number
  unread_conversations: number
  total_messages: number
  unread_messages: number
}

export interface PaginatedResponse<T> {
  data: T[]
  meta: {
    limit: number
    page: number
    total: number
    totalPages: number
  }
}

// Types spécialisés pour les réponses API
export type ConversationsResponse = PaginatedResponse<Conversation>
export type MessagesResponse = PaginatedResponse<Message>
