// =========================================
// TYPES - Statistiques Commandes
// Alignés sur les réponses du backend
// =========================================

export interface OrdersStatsQueryParams {
  restaurantId?: string;
  startDate?: string;
  endDate?: string;
  period?: 'today' | 'yesterday' | 'week' | 'lastWeek' | 'month' | 'lastMonth' | 'year';
  type?: 'DELIVERY' | 'PICKUP' | 'TABLE';
  status?: string;
  channel?: 'app' | 'call';
  granularity?: 'day' | 'week' | 'month';
}

// ----- Vue d'ensemble -----
export interface OrderByStatusItem {
  status: string;
  label: string;
  count: number;
  percentage: number;
}

export interface OrderByTypeItem {
  type: string;
  label: string;
  count: number;
  revenue: number;
  percentage: number;
}

export interface OrdersOverviewResponse {
  totalOrders: number;
  totalRevenue: number;
  totalRevenueFormatted: string;
  averageBasket: number;
  cancelledOrders: number;
  cancellationRate: number;
  evolution: string;
  byStatus: OrderByStatusItem[];
  byType: OrderByTypeItem[];
}

// ----- Par Canal -----
export interface ChannelStatsData {
  totalOrders: number;
  revenue: number;
  averageBasket: number;
  newClientsOrders: number;
  recurringClientsOrders: number;
  newClientsRate: number;
}

export interface ChannelDailyTrendPoint {
  date: string;
  label: string;
  newViaApp: number;
  newViaCallCenter: number;
  recurringViaApp: number;
  recurringViaCallCenter: number;
  total: number;
}

export interface OrdersByChannelResponse {
  app: ChannelStatsData;
  callCenter: ChannelStatsData;
  dailyTrend: ChannelDailyTrendPoint[];
}

// ----- Temps de traitement -----
export interface ProcessingStepStats {
  step: string;
  description: string;
  averageMinutes: number;
  minMinutes: number;
  maxMinutes: number;
}

export interface ProcessingTimeResponse {
  averageMinutes: number;
  minMinutes: number;
  maxMinutes: number;
  sampleSize: number;
  byStep: ProcessingStepStats[];
}

// ----- Commandes en retard -----
export interface LateOrdersResponse {
  totalDeliveryOrders: number;
  onTimeOrders: number;
  lateOrders: number;
  lateRate: number;
  averageDelayMinutes: number;
  maxDelayMinutes: number;
}

// ----- Par Restaurant -----
export interface RestaurantOrderStats {
  restaurantId: string;
  restaurantName: string;
  restaurantImage: string;
  totalOrders: number;
  revenue: number;
  revenueFormatted: string;
  averageBasket: number;
  percentage: number;
  evolution: string;
}

export interface OrdersByRestaurantResponse {
  items: RestaurantOrderStats[];
  totalOrders: number;
  totalRevenue: number;
}

// ----- Ponctualité restaurant (accepted_at → ready_at) -----
export interface RestaurantPunctualityItem {
  restaurantId: string;
  restaurantName: string;
  totalOrders: number;
  averagePrepMinutes: number;
  minPrepMinutes: number;
  maxPrepMinutes: number;
}

export interface RestaurantPunctualityResponse {
  totalOrders: number;
  averagePrepMinutes: number;
  minPrepMinutes: number;
  maxPrepMinutes: number;
  byRestaurant: RestaurantPunctualityItem[];
}

// ----- Par Restaurant et Type (histogrammes empilés) -----
export interface RestaurantTypeItem {
  restaurantId: string;
  restaurantName: string;
  delivery: number;
  pickup: number;
  table: number;
  total: number;
}

export interface OrdersByRestaurantAndTypeResponse {
  items: RestaurantTypeItem[];
}

// ----- Par Restaurant et Source (App / Call Center) -----
export interface RestaurantSourceItem {
  restaurantId: string;
  restaurantName: string;
  app: number;
  callCenter: number;
  total: number;
}

export interface OrdersByRestaurantAndSourceResponse {
  items: RestaurantSourceItem[];
}

// ----- Zones Clients (heat map) -----
export interface ClientZonePoint {
  lat: number;
  lng: number;
  count: number;
}

export interface ClientZonesResponse {
  points: ClientZonePoint[];
  totalOrders: number;
  totalPoints: number;
  center: { lat: number; lng: number };
}

// ----- Tendance journalière -----
export interface DailyOrdersTrendPoint {
  date: string;
  label: string;
  count: number;
  revenue: number;
  averageBasket: number;
}

export interface OrdersDailyTrendResponse {
  data: DailyOrdersTrendPoint[];
  totalOrders: number;
  totalRevenue: number;
}

// ----- Tendance par Restaurant (histogramme empilé) -----
export interface RestaurantMetrics {
  count: number;
  revenue: number;
  avgBasket: number;
  onTimeRate: number;
}

export interface DailyTrendByRestaurantPoint {
  date: string;
  label: string;
  byRestaurant: Record<string, RestaurantMetrics>;
  total: RestaurantMetrics;
}

export interface RestaurantInfo {
  id: string;
  name: string;
}

export interface DailyTrendByRestaurantResponse {
  restaurants: RestaurantInfo[];
  data: DailyTrendByRestaurantPoint[];
}

// ----- Restaurants Locations -----
export interface RestaurantLocationItem {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  image: string;
  address: string;
}

export interface RestaurantsLocationsResponse {
  restaurants: RestaurantLocationItem[];
}

// ----- Zones d'influence restaurants -----
export interface InfluenceZonePoint {
  lat: number;
  lng: number;
  restaurantId: string;
  count: number;
}

export interface InfluenceZonesResponse {
  restaurants: RestaurantInfo[];
  points: InfluenceZonePoint[];
  totalOrders: number;
  center: { lat: number; lng: number };
}
