import { api } from '../../../src/services/api';
import {
  OrdersStatsQueryParams,
  OrdersOverviewResponse,
  OrdersByChannelResponse,
  ProcessingTimeResponse,
  LateOrdersResponse,
  RestaurantPunctualityResponse,
  OrdersByRestaurantResponse,
  OrdersByRestaurantAndTypeResponse,
  OrdersByRestaurantAndSourceResponse,
  OrdersDailyTrendResponse,
  ClientZonesResponse,
  DailyTrendByRestaurantResponse,
  RestaurantsLocationsResponse,
  InfluenceZonesResponse,
} from '../types/orders-stats.types';

function buildQueryString(params: Record<string, string | number | undefined>): string {
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      qs.append(key, String(value));
    }
  }
  const str = qs.toString();
  return str ? `?${str}` : '';
}

/**
 * Vue d'ensemble commandes : total, CA, panier moyen, tendance vs période précédente.
 */
export async function getOrdersOverview(
  params: OrdersStatsQueryParams = {},
): Promise<OrdersOverviewResponse> {
  const qs = buildQueryString(params as Record<string, string | number | undefined>);
  return api.get<OrdersOverviewResponse>(`/statistics/orders/overview${qs}`);
}

/**
 * Commandes App vs Call Center, répartition nouveaux / récurrents.
 */
export async function getOrdersByChannel(
  params: OrdersStatsQueryParams = {},
): Promise<OrdersByChannelResponse> {
  const qs = buildQueryString(params as Record<string, string | number | undefined>);
  return api.get<OrdersByChannelResponse>(`/statistics/orders/by-channel${qs}`);
}

/**
 * Temps de traitement : création → acceptation → prêt → livraison.
 */
export async function getOrdersProcessingTime(
  params: OrdersStatsQueryParams = {},
): Promise<ProcessingTimeResponse> {
  const qs = buildQueryString(params as Record<string, string | number | undefined>);
  return api.get<ProcessingTimeResponse>(`/statistics/orders/processing-time${qs}`);
}

/**
 * Commandes en retard vs dans les délais.
 */
export async function getLateOrders(
  params: OrdersStatsQueryParams = {},
): Promise<LateOrdersResponse> {
  const qs = buildQueryString(params as Record<string, string | number | undefined>);
  return api.get<LateOrdersResponse>(`/statistics/orders/late${qs}`);
}

/**
 * Volume et CA par restaurant.
 */
export async function getOrdersByRestaurant(
  params: OrdersStatsQueryParams = {},
): Promise<OrdersByRestaurantResponse> {
  const qs = buildQueryString(params as Record<string, string | number | undefined>);
  return api.get<OrdersByRestaurantResponse>(`/statistics/orders/by-restaurant${qs}`);
}

/**
 * Ponctualité restaurant : temps de préparation (accepted_at → ready_at).
 */
export async function getRestaurantPunctuality(
  params: OrdersStatsQueryParams = {},
): Promise<RestaurantPunctualityResponse> {
  const qs = buildQueryString(params as Record<string, string | number | undefined>);
  return api.get<RestaurantPunctualityResponse>(`/statistics/orders/restaurant-punctuality${qs}`);
}

/**
 * Répartition par restaurant et par type (histogrammes empilés).
 */
export async function getOrdersByRestaurantAndType(
  params: OrdersStatsQueryParams = {},
): Promise<OrdersByRestaurantAndTypeResponse> {
  const qs = buildQueryString(params as Record<string, string | number | undefined>);
  return api.get<OrdersByRestaurantAndTypeResponse>(`/statistics/orders/by-restaurant-and-type${qs}`);
}

/**
 * Répartition par restaurant et par source (App / Call Center).
 */
export async function getOrdersByRestaurantAndSource(
  params: OrdersStatsQueryParams = {},
): Promise<OrdersByRestaurantAndSourceResponse> {
  const qs = buildQueryString(params as Record<string, string | number | undefined>);
  return api.get<OrdersByRestaurantAndSourceResponse>(`/statistics/orders/by-restaurant-and-source${qs}`);
}

/**
 * Zones clients : coordonnées de livraison pour heat map.
 */
export async function getClientZones(
  params: OrdersStatsQueryParams = {},
): Promise<ClientZonesResponse> {
  const qs = buildQueryString(params as Record<string, string | number | undefined>);
  return api.get<ClientZonesResponse>(`/statistics/orders/client-zones${qs}`);
}

/**
 * Tendance journalière / hebdomadaire / mensuelle des commandes.
 */
export async function getOrdersDailyTrend(
  params: OrdersStatsQueryParams = {},
): Promise<OrdersDailyTrendResponse> {
  const qs = buildQueryString(params as Record<string, string | number | undefined>);
  return api.get<OrdersDailyTrendResponse>(`/statistics/orders/daily-trend${qs}`);
}

/**
 * Tendance par restaurant : histogramme empilé (count, revenue, avgBasket, onTimeRate).
 */
export async function getDailyTrendByRestaurant(
  params: OrdersStatsQueryParams = {},
): Promise<DailyTrendByRestaurantResponse> {
  const qs = buildQueryString(params as Record<string, string | number | undefined>);
  return api.get<DailyTrendByRestaurantResponse>(`/statistics/orders/daily-trend-by-restaurant${qs}`);
}

/**
 * Positions des restaurants (lat/lng) pour les marqueurs carte.
 */
export async function getRestaurantsLocations(): Promise<RestaurantsLocationsResponse> {
  return api.get<RestaurantsLocationsResponse>('/statistics/orders/restaurants-locations');
}

/**
 * Zones d'influence : livraisons associées au restaurant (carte couleur).
 */
export async function getInfluenceZones(
  params: OrdersStatsQueryParams = {},
): Promise<InfluenceZonesResponse> {
  const qs = buildQueryString(params as Record<string, string | number | undefined>);
  return api.get<InfluenceZonesResponse>(`/statistics/orders/influence-zones${qs}`);
}
