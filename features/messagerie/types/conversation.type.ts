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

/**
 * Réaction déjà AGRÉGÉE par le serveur : l'emoji, son compte, et « l'ai-je
 * posé ». Ce n'est pas au client de recalculer, sinon le backoffice, l'app et
 * la caisse en tireraient trois résultats différents.
 */
export interface IReaction {
  emoji: string;
  count: number;
  mine: boolean;
}

export interface IMessage {
  reactions?: IReaction[];
  /** Message retiré : le serveur a déjà remplacé le corps et retiré la pièce jointe. */
  deleted?: boolean;
  deletedAt?: string | null;
  id: string;
  isRead: boolean;
  /**
   * Heure à laquelle le destinataire a ouvert la conversation.
   *
   * ⚠️ Sémantique honnête : « la conversation a été ouverte », et non « ce
   * message précis a été lu ». C'est le seul signal dont dispose le serveur.
   */
  readAt?: string | null;
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
  /**
   * Groupe interne : aucun client et plus de deux participants. Calculé par le
   * serveur pour que tous les écrans s'accordent sur la même règle.
   */
  isGroup?: boolean;
  /** Ce groupe reçoit les alertes du système. */
  receivesAlerts?: boolean;
}

export interface IStatsMessages {
  total_conversations: number;
  unread_conversations: number;
  total_messages: number;
  unread_messages: number;
}

export interface ICreerConversationDTO {
  receiver_user_id?: string;
  /**
   * Groupe interne : les collègues à réunir, hors créateur. Deux ou plus créent
   * un groupe ; un seul équivaut à `receiver_user_id`.
   */
  participant_user_ids?: string[];
  seed_message: string;
  restaurant_id?: string;
  subject?: string;
  customer_to_contact_id?: string;
}
