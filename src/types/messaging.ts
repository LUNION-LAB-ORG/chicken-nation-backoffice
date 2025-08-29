import { DateAdapter } from "chart.js";

// Types pour les messages selon la structure réelle de l'API
export interface MessageAuthor {
  id: string;
  first_name?: string;
  last_name?: string;
  name?: string;
  email?: string;
  image?: string;
}

export interface Message {
  created_at: DateAdapter;
  content: string;
  sender_type: string;
  message_type: string;
  id: string;
  conversationId: string;
  body: string;
  authorCustomer?: MessageAuthor | null;
  authorUser?: MessageAuthor | null;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Conversation {
  id: string
  client_id: string
  last_message_at: string
  unread_count: number
  status: 'ACTIVE' | 'CLOSED' | 'ARCHIVED'
  created_at: string
  updated_at: string
  // Informations du client
  client: {
    id: string
    fullname: string
    email: string
    phone?: string
    image?: string
    user_type?: string
    is_connected?: boolean
  }
  // Dernier message pour l'aperçu
  last_message?: {
    id: string
    content: string
    sender_type: 'CLIENT' | 'BACKOFFICE'
    message_type: 'TEXT' | 'IMAGE' | 'FILE'
    created_at: string
  }
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
