// =========================================
// TYPES - Statistiques Livraison
// Alignés sur les réponses du backend
// =========================================

export interface DeliveryStatsQueryParams {
  restaurantId?: string;
  startDate?: string;
  endDate?: string;
  period?: 'today' | 'week' | 'month' | 'lastMonth' | 'year';
  limit?: number;
}

// ----- Vue d'ensemble -----
export interface DeliveryOverviewResponse {
  totalDeliveries: number;
  totalFeesCollected: number;
  totalFeesFormatted: string;
  averageFee: number;
  totalRevenue: number;
  totalRevenueFormatted: string;
  turboCount: number;
  freeCount: number;
  turboPercentage: number;
  freePercentage: number;
  evolution: string;
}

// ----- Décomposition des frais -----
export interface DeliveryFeeBreakdownItem {
  label: string;
  feeAmount: number;
  orderCount: number;
  revenueGenerated: string;
  deliveryFeesCollected: number;
  percentage: number;
}

export interface DeliveryFeesBreakdownResponse {
  breakdown: DeliveryFeeBreakdownItem[];
  totalDeliveryFees: number;
  totalDeliveryRevenue: number;
}

// ----- Par Zone -----
export interface DeliveryZoneItem {
  zone: string;
  orderCount: number;
  revenue: number;
  revenueFormatted: string;
  percentage: number;
  latitude?: number;
  longitude?: number;
}

export interface DeliveryByZoneResponse {
  items: DeliveryZoneItem[];
  totalDeliveries: number;
}

// ----- Performance -----
export interface DeliveryPerformanceResponse {
  averageDeliveryMinutes: number;
  minDeliveryMinutes: number;
  maxDeliveryMinutes: number;
  onTimeRate: number;
  lateOrders: number;
  onTimeOrders: number;
  averageDelayMinutes: number;
  maxDelayMinutes: number;
}
