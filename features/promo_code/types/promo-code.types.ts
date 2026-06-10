export type DiscountType = 'PERCENTAGE' | 'FIXED_AMOUNT' | 'BUY_X_GET_Y';

export type TargetType = 'ALL_PRODUCTS' | 'SPECIFIC_PRODUCTS' | 'CATEGORIES';

export interface PromoCodeCreator {
  id: string;
  email: string;
  fullname: string;
}

export interface PromoCodeTargetedDish {
  id: string;
  promo_code_id: string;
  dish_id: string;
  dish?: {
    id: string;
    name: string;
    image: string | null;
    price: number;
    category_id: string;
  };
}

export interface PromoCodeTargetedCategory {
  id: string;
  promo_code_id: string;
  category_id: string;
  category?: {
    id: string;
    name: string;
    image: string | null;
  };
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
  status?: string;
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
  target_type: TargetType;
  created_by: string | null;
  creator: PromoCodeCreator | null;
  created_at: string;
  updated_at: string;
  entity_status: string;
  usages?: PromoCodeUsage[];
  promo_code_targeted_dishes?: PromoCodeTargetedDish[];
  promo_code_targeted_categories?: PromoCodeTargetedCategory[];
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
  target_type?: TargetType;
  targeted_dish_ids?: string[];
  targeted_category_ids?: string[];
}

export interface UpdatePromoCodeDto extends Partial<CreatePromoCodeDto> {}

export interface PromoCodeStats {
  activeCount: number;
  totalUsage: number;
}

// ================================
// Analytics détaillées (vue détail)
// ================================

export interface PromoCodeAnalyticsKpis {
  total_usages: number;
  unique_customers: number;
  orders_count: number;
  total_discount: number;
  total_revenue: number;
  avg_basket: number;
  avg_discount: number;
  /** Part des clients ayant utilisé le code plus d'une fois (0..1) */
  repeat_rate: number;
  first_usage_at: string | null;
  last_usage_at: string | null;
}

export interface PromoCodeAnalyticsDay {
  date: string; // yyyy-MM-dd
  usages: number;
  discount: number;
}

export interface PromoCodeAnalyticsHour {
  hour: number; // 0..23
  usages: number;
}

export interface PromoCodeAnalyticsWeekday {
  weekday: number; // 0 = dimanche .. 6 = samedi
  usages: number;
}

export interface PromoCodeTopCustomer {
  customer_id: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  usages: number;
  total_discount: number;
}

export interface PromoCodeAnalytics {
  kpis: PromoCodeAnalyticsKpis;
  by_day: PromoCodeAnalyticsDay[];
  by_hour: PromoCodeAnalyticsHour[];
  by_weekday: PromoCodeAnalyticsWeekday[];
  top_customers: PromoCodeTopCustomer[];
}

export interface PromoCodeUsagesPage {
  data: PromoCodeUsage[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
