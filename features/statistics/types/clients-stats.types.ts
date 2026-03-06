// =========================================
// TYPES - Statistiques Clients
// =========================================

export interface ClientsStatsQueryParams {
  restaurantId?: string;
  startDate?: string;
  endDate?: string;
  period?: 'today' | 'week' | 'month' | 'lastMonth' | 'year';
  limit?: number;
}

export interface InactiveClientsQueryParams {
  restaurantId?: string;
  inactiveDays?: number;
  limit?: number;
}

// ----- Vue d'ensemble -----
export interface ClientsOverviewResponse {
  totalClients: number;
  newClients: number;
  recurringClients: number;
  newClientsRate: number;        // En pourcentage
  averageLtv: number;
  averageLtvFormatted: string;
  averageBasket: number;
  averageBasketFormatted: string;
  averageOrderFrequency: number; // Commandes/mois
  appClients: number;
  callCenterClients: number;
}

// ----- Acquisition (tendance journalière) -----
export interface ClientAcquisitionDailyPoint {
  date: string;
  label: string;
  newViaApp: number;
  newViaCallCenter: number;
  recurringViaApp: number;
  recurringViaCallCenter: number;
}

export interface ClientsAcquisitionResponse {
  dailyTrend: ClientAcquisitionDailyPoint[];
  totalNew: number;
  totalRecurring: number;
  retentionRate: number;
}

// ----- Rétention -----
export interface ClientsRetentionResponse {
  activeClients: number;         // Commandé dans les 30 derniers jours
  churn30Days: number;           // Inactifs depuis > 30j
  churnRate30: number;
  churn60Days: number;           // Inactifs depuis > 60j
  churnRate60: number;
  atRiskClients: number;         // Inactifs 30-60j (à risque)
  retentionRate: number;
}

// ----- Top Clients -----
export interface TopClientItem {
  id: string;
  fullname: string;
  phone: string;
  email: string;
  image: string;
  totalOrders: number;
  ordersInPeriod: number;
  totalSpent: number;
  totalSpentFormatted: string;
  averageBasket: number;
  lastOrderDate: string;
  preferredChannel: 'APP' | 'CALL_CENTER' | 'MIXED';
  loyaltyLevel: string;
}

export interface TopClientsResponse {
  items: TopClientItem[];
  totalCount: number;
}

// ----- Clients inactifs -----
export interface InactiveClientItem {
  id: string;
  fullname: string;
  phone: string;
  email: string;
  lastOrderDate: string;
  daysSinceLastOrder: number;
  totalOrders: number;
  totalSpent: number;
  preferredChannel: 'APP' | 'CALL_CENTER' | 'MIXED';
}

export interface InactiveClientsResponse {
  items: InactiveClientItem[];
  totalCount: number;
  inactiveDays: number;
}

// ----- Par Zone -----
export interface ClientZoneItem {
  zone: string;
  clientCount: number;
  orderCount: number;
  percentage: number;
}

export interface ClientsByZoneResponse {
  items: ClientZoneItem[];
  totalClients: number;
}

// ----- Fiche analytique client -----
export interface ClientTopDishItem {
  dishId: string;
  dishName: string;
  image: string;
  orderCount: number;
}

export interface ClientAnalyticsProfileResponse {
  id: string;
  fullname: string;
  phone: string;
  image: string;
  preferredChannel: 'APP' | 'CALL_CENTER' | 'MIXED';
  orderFrequencyPerMonth: number;
  ltv: number;
  ltvFormatted: string;
  averageBasket: number;
  totalOrders: number;
  firstOrderDate: string;
  lastOrderDate: string;
  topDishes: ClientTopDishItem[];
  loyaltyLevel: string;
  loyaltyPoints: number;
}

// ----- Répartition Fidélité -----
export interface LoyaltyLevelItem {
  level: string;
  clientCount: number;
  percentage: number;
  averageRevenue: number;
}

export interface LoyaltyDistributionResponse {
  items: LoyaltyLevelItem[];
  totalClients: number;
}

// ----- Méthode de Paiement -----
export interface PaymentMethodItem {
  method: string;
  clientCount: number;
  orderCount: number;
  percentage: number;
  revenue: number;
}

export interface PaymentMethodDistributionResponse {
  items: PaymentMethodItem[];
  totalClients: number;
}

// ----- Concentration du CA (Pareto) -----
export interface RevenueConcentrationResponse {
  top10Percentage: number;
  top20Percentage: number;
  top50Percentage: number;
  totalRevenue: number;
  totalClients: number;
}

// ----- Panier Moyen Nouveaux vs Récurrents -----
export interface BasketComparisonResponse {
  newClientsBasket: number;
  recurringClientsBasket: number;
  newClientsRevenue: number;
  recurringClientsRevenue: number;
  newClientsOrders: number;
  recurringClientsOrders: number;
}
