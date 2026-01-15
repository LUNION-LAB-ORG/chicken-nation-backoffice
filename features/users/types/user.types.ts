import { EntityStatus } from "../../../types";
import { ConversationUser, Message, TicketMessage, TicketParticipant, TicketThread, TicketUserSkill } from "../../messages/types/messages.types";
import { Promotion } from "../../promotion/types/promotion.types";
import { Restaurant } from "../../restaurants/types/restaurant.types";


export enum UserType { BACKOFFICE = 'BACKOFFICE', RESTAURANT = 'RESTAURANT' };

export enum UserRole {
    ADMIN = 'ADMIN',
    MARKETING = 'MARKETING',
    COMPTABLE = 'COMPTABLE',
    MANAGER = 'MANAGER',
    CAISSIER = 'CAISSIER',
    CALL_CENTER = 'CALL_CENTER',
    CUISINE = 'CUISINE',
    ASSISTANT_MANAGER = 'ASSISTANT_MANAGER'
};

export interface User {
    id: string;
    fullname: string;
    email: string;
    phone: string | null;
    image: string | null;
    address: string | null;
    password_is_updated: boolean;
    type: UserType;
    role: UserRole;
    restaurant_id: string | null;
    // Relations
    restaurant?: Restaurant | null;
    created_promotions?: Promotion[];
    TicketMessage?: TicketMessage[];
    TicketParticipant?: TicketParticipant[];
    Message?: Message[];
    ConversationUser?: ConversationUser[];
    TicketThread?: TicketThread[];
    //   Voucher?: Voucher[];
    TicketUserSkill?: TicketUserSkill[];
    // Metadata
    entity_status: EntityStatus;
    created_at: Date | string;
    updated_at: Date | string;
    last_login_at: Date | string | null;
}


export interface CreateUserDto {
    fullname: string;
    email: string;
    phone?: string;
    address?: string;
    image?: File;
    role: string;
    type?: string;
    restaurant_id?: string;
}

export interface UpdateUserDto {
    email?: string;
    fullname?: string;
    password?: string;
    role?: string;
    type?: string;
    restaurant?: string;
}

