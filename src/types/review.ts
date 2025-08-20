// Types pour les avis

export interface Review {
  id: string;
  customer_id: string;
  restaurant_id: string;
  order_id?: string;
  rating: number;
  comment?: string;
  created_at: string;
  updated_at: string;
  customer?: {
    id: string;
    first_name?: string;
    last_name?: string;
    email?: string;
  };
  restaurant?: {
    id: string;
    name: string;
  };
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
