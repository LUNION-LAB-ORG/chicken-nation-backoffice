export type DiscountType = 'PERCENTAGE' | 'FIXED_AMOUNT' | 'BUY_X_GET_Y';

export interface PromoCodeCreator {
  id: string;
  email: string;
  fullname: string;
}

export interface PromoCodeUsageCustomer {
  id: string;
  first_name: string | null;
  last_name: string | null;
  phone: string;
}

export interface PromoCodeUsageOrder {
  id: string;
  reference: string;
  amount: number;
}

export interface PromoCodeUsage {
  id: string;
  promo_code_id: string;
  customer_id: string;
  order_id: string | null;
  discount_amount: number;
  created_at: string;
  customer?: PromoCodeUsageCustomer;
  order?: PromoCodeUsageOrder;
}

export interface PromoCode {
  id: string;
  code: string;
  description: string | null;
  discount_type: DiscountType;
  discount_value: number;
  min_order_amount: number | null;
  max_discount_amount: number | null;
  max_usage: number | null;
  max_usage_per_user: number | null;
  usage_count: number;
  start_date: string;
  expiration_date: string;
  is_active: boolean;
  restaurant_ids: string[];
  created_by: string | null;
  creator: PromoCodeCreator | null;
  created_at: string;
  updated_at: string;
  entity_status: string;
  usages?: PromoCodeUsage[];
  _count?: {
    usages: number;
  };
}

export interface PromoCodeQuery {
  code?: string;
  is_active?: boolean;
  discount_type?: DiscountType;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface CreatePromoCodeDto {
  code: string;
  description?: string;
  discount_type: DiscountType;
  discount_value: number;
  min_order_amount?: number;
  max_discount_amount?: number;
  max_usage?: number;
  max_usage_per_user?: number;
  start_date: string;
  expiration_date: string;
  is_active?: boolean;
  restaurant_ids?: string[];
}

export interface UpdatePromoCodeDto extends Partial<CreatePromoCodeDto> {}

export interface PromoCodeStats {
  activeCount: number;
  totalUsage: number;
}
