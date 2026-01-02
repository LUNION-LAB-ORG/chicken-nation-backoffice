import { EntityStatus } from "../../../types";
import { Customer } from "../../customer/types/customer.types";
import { Order } from "../../orders/types/order.types";
import { Restaurant } from "../../restaurants/types/restaurant.types";

export enum TicketStatus {
    OPEN = 'OPEN',
    CLOSED = 'CLOSED'
}

export enum TicketPriority {
    LOW = 'LOW',
    MEDIUM = 'MEDIUM',
    HIGH = 'HIGH'
}


export interface Conversation {
    id: string;
    subject?: string | null;
    restaurantId?: string | null;
    customerId?: string | null;
    createdAt: string;
    updatedAt: string;

    // Relations
    restaurant?: Restaurant; // Interface Restaurant
    customer?: Customer;   // Interface Customer
    users?: ConversationUser[];
    messages?: Message[];
    escalations?: TicketThread[];
}

export interface ConversationUser {
    conversationId: string;
    userId: string;
    joinedAt: string;

    conversation?: Conversation;
    // user?: any; // Interface User
}

export interface Message {
    id: string;
    conversationId: string;
    authorUserId?: string | null;
    authorCustomerId?: string | null;
    body: string;
    meta?: any;
    isRead: boolean;
    createdAt: string;
    updatedAt: string;

    authorUser?: any;
    authorCustomer?: any;
}


export interface TicketThread {
    id: string;
    subject: string;
    code: string; // ex: TCK-0001
    status: TicketStatus;
    priority: TicketPriority;
    source?: string | null;

    customerId?: string | null;
    categoryId?: string | null;
    assigneeId?: string | null;
    fromConversationId?: string | null;
    orderId?: string | null;

    firstResponseAt?: string | null;
    resolvedAt?: string | null;
    createdAt: string;
    updatedAt: string;

    // Relations
    customer?: Customer;
    category?: TicketCategory;
    // assignee?: any; // Interface User (Agent)
    order?: Order;
    participants?: TicketParticipant[];
    messages?: TicketMessage[];
}

export interface TicketParticipant {
    ticketId: string;
    userId: string;
    joinedAt: string;

    ticket?: TicketThread;
    // user?: any;
}

export interface TicketMessage {
    id: string;
    ticketId: string;
    authorUserId?: string | null;
    authorCustomerId?: string | null;
    body: string;
    meta?: any;
    isRead: boolean;
    internal: boolean; // Message privé entre agents
    createdAt: string;

    // authorUser?: any;
    authorCustomer?: Customer;
}

export interface TicketCategory {
    id: string;
    name: string;
    description?: string | null;
    entity_status: EntityStatus; // Utilise l'enum défini précédemment
    created_at: string;
    updated_at: string;

    agents?: TicketUserSkill[];
}

export interface TicketUserSkill {
    id: string;
    userId: string;
    categoryId: string;

    category?: TicketCategory;
    // user?: any;
}