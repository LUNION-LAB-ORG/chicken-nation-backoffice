// Types pour les commandes

export type OrderStatus = 
  | 'NOUVELLE'
  | 'EN COURS'
  | 'EN PREPARATION'
  | 'PRET'
  | 'LIVRAISON'
  | 'LIVRE'
  | 'COLLECTE'
  | 'ANNULÉ'
  | 'PENDING'
  | 'ACCEPTED'
  | 'IN_PROGRESS'
  | 'READY'
  | 'PICKED_UP'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'COLLECTED';

export type OrderType = 'DELIVERY' | 'PICKUP' | 'TABLE';

export interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  image: string;
}

export interface Order {
  id: string;
  orderNumber?: string;
  status: OrderStatus;
  type: OrderType;
  customer?: {
    id: string;
    firstName?: string;
    lastName?: string;
    email?: string;
  };
  restaurant?: {
    id: string;
    name: string;
  };
  items: OrderItem[];
  total: number;
  deliveryFee?: number;
  address?: string;
  table_number?: string;
  table_type?: string;
  places?: number;
  date?: string;
  time?: string;
  created_at: string;
  updated_at: string;
  [key: string]: unknown;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    totalItems: number;
    itemCount: number;
    itemsPerPage: number;
    totalPages: number;
    currentPage: number;
  };
}
