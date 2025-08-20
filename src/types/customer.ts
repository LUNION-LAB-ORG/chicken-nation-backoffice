 
export type CustomerStatus = 'ACTIVE' | 'INACTIVE' | 'BLOCKED' | 'NEW';

export interface CustomerAddress {
  id: string;
  street: string;
  city: string;
  postal_code: string;
  country: string;
  is_default?: boolean;
}

export interface Customer {
  id: string;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  phone?: string;
  addresses?: CustomerAddress[];
  image?: string | null;
  created_at: string;
  updated_at: string;
  entity_status: CustomerStatus;
  birth_day?: string | null;
  totalOrders?: number;
  lastOrderDate?: string;
  isConnected?: boolean;
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
