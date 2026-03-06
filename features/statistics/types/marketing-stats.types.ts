// =========================================
// TYPES - Statistiques Marketing
// =========================================

export interface MarketingQueryParams {
  restaurantId?: string;
  startDate?: string;
  endDate?: string;
  period?: 'today' | 'week' | 'month' | 'lastMonth' | 'year';
  promotionId?: string;
  promoCode?: string;
}

export interface ChurnExportQueryParams {
  restaurantId?: string;
  inactiveDays?: number;
}

export interface TopZonesQueryParams {
  restaurantId?: string;
  startDate?: string;
  endDate?: string;
  period?: 'today' | 'week' | 'month' | 'lastMonth' | 'year';
  limit?: number;
}

// ----- Utilisation Promos -----
export interface PromoUsageItem {
  id: string;
  title: string;
  discountType: string;
  discountValue: number;
  usageCount: number;
  totalDiscount: number;
  totalDiscountFormatted: string;
  revenueGenerated: number;
  revenueGeneratedFormatted: string;
  uniqueUsers: number;
}

export interface PromoUsageResponse {
  items: PromoUsageItem[];
  totalPromos: number;
  totalDiscountAccorded: number;
  totalRevenueWithPromo: number;
}

// ----- Performance des Promotions -----
export interface PromotionPerformanceItem {
  id: string;
  title: string;
  status: string;
  usageCount: number;
  maxUsage: number;
  usageRate: number;             // En pourcentage
  revenueGenerated: number;
  revenueGeneratedFormatted: string;
  startDate: string;
  expirationDate: string;
}

export interface PromotionsPerformanceResponse {
  items: PromotionPerformanceItem[];
  totalActivePromos: number;
  totalRevenueWithPromo: number;
}

// ----- Top Zones (Street Marketing) -----
export interface TopZoneItem {
  zone: string;
  orderCount: number;
  revenue: number;
  revenueFormatted: string;
  percentage: number;
  latitude?: number;
  longitude?: number;
}

export interface TopZonesResponse {
  items: TopZoneItem[];
  totalOrders: number;
}

// ----- Export Churn -----
export interface ChurnExportItem {
  phone: string;
  firstName: string;
  lastName: string;
  email: string;
  lastOrderDate: string;
  daysSinceLastOrder: number;
  totalOrders: number;
  totalSpent: number;
  preferredChannel: 'APP' | 'CALL_CENTER' | 'MIXED';
}

export interface ChurnExportResponse {
  items: ChurnExportItem[];
  totalCount: number;
  inactiveDays: number;
}
