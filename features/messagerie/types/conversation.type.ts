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

/** Nature du message cité, pour choisir l'icône et le texte de repli. */
export type TypeCitation = 'text' | 'image' | 'audio' | 'alert';

/** Qui a écrit le message cité. `system` = alerte, `broadcast` = diffusion. */
export type TypeAuteurCitation = 'user' | 'customer' | 'system' | 'broadcast';

/**
 * MESSAGE CITÉ, tel que le serveur le résume.
 *
 * L'extrait est calculé à chaque lecture à partir de l'original, jamais copié :
 * si l'original est retiré, `deleted` passe à vrai et l'extrait devient « Ce
 * message a été supprimé », partout et en direct.
 */
export interface ICitationMessage {
  id: string;
  deleted: boolean;
  kind: TypeCitation;
  /** Texte réduit à 160 caractères, vide pour une photo ou un vocal sans légende. */
  excerpt: string;
  author: { kind: TypeAuteurCitation; id: string | null; name: string };
  createdAt: string;
}

/**
 * PERSONNE MENTIONNÉE dans un message.
 *
 * `label` est le nom figé par le serveur au moment de l'envoi : c'est lui qu'on
 * recherche dans le corps (« @Awa Koné ») pour le surligner.
 */
export interface IMentionMessage {
  userId: string;
  label: string;
}

export interface IMessage {
  reactions?: IReaction[];
  /** Message auquel celui-ci répond. Absent ou nul : ce n'est pas une réponse. */
  replyTo?: ICitationMessage | null;
  /** Collègues mentionnés et retenus par le serveur. Vide si le message est retiré. */
  mentions?: IMentionMessage[];
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
  /**
   * Peut être mentionné : compte actif ET rôle qui a accès à la messagerie.
   * Calculé par le serveur, qui applique la même règle quand il reçoit la
   * mention. Absent tant que le serveur n'est pas à jour.
   */
  mentionnable?: boolean;
}

/** Réponse de la route de position d'un message dans le fil paginé. */
export interface IPositionMessage {
  messageId: string;
  /** Page (1 = la plus récente) qui contient le message, pour cette taille de page. */
  page: number;
  limit: number;
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
