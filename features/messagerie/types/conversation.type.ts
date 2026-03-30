export interface IAuteurUtilisateur {
  id: string;
  name: string;
  email: string;
  image?: string | null;
}

export interface IAuteurClient {
  id: string;
  name: string;
  first_name: string;
  last_name: string;
  image?: string | null;
}

export interface IMessage {
  id: string;
  isRead: boolean;
  body: string;
  meta?: Record<string, unknown>;
  authorUser?: IAuteurUtilisateur | null;
  authorCustomer?: IAuteurClient | null;
  createdAt: string;
  updatedAt: string;
  conversation?: {
    id: string;
    restaurantId?: string | null;
    customerId?: string | null;
  };
}

export interface IClient {
  id: string;
  first_name: string;
  last_name: string;
  image?: string;
  email?: string;
  phone?: string;
}

export interface IRestaurant {
  id: string;
  name: string;
  image?: string;
}

export interface IParticipantConversation {
  id: string;
  fullName: string;
  image?: string | null;
  role: string;
}

export interface IConversation {
  id: string;
  unreadNumber: number;
  customerId: string | null;
  createdAt: string;
  updatedAt?: string;
  messages: IMessage[];
  restaurant?: IRestaurant | null;
  customer: IClient | null;
  users: IParticipantConversation[];
  subject?: string | null;
}

export interface IStatsMessages {
  total_conversations: number;
  unread_conversations: number;
  total_messages: number;
  unread_messages: number;
}

export interface ICreerConversationDTO {
  receiver_user_id?: string;
  seed_message: string;
  restaurant_id?: string;
  subject?: string;
  customer_to_contact_id?: string;
}
