import { api } from '../../../src/services/api';
import {
  ProductsStatsQueryParams,
  ProductsComparisonQueryParams,
  TopProductsResponse,
  TopCategoriesResponse,
  ProductComparisonResponse,
  ProductsByRestaurantResponse,
  ProductsByZoneResponse,
  SalesTrendResponse,
  ChannelBreakdownResponse,
  PromotionPerformanceResponse,
} from '../types/products-stats.types';

const PERIOD_MAP: Record<string, string> = { lastMonth: 'last_month', lastWeek: 'last_week' };

function buildQueryString(params: Record<string, string | number | undefined>): string {
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      const v = key === 'period' ? (PERIOD_MAP[String(value)] ?? String(value)) : String(value);
      qs.append(key, v);
    }
  }
  const str = qs.toString();
  return str ? `?${str}` : '';
}

/**
 * Top produits par volume de vente sur la période.
 */
export async function getTopProducts(params: ProductsStatsQueryParams = {}): Promise<TopProductsResponse> {
  const qs = buildQueryString(params as Record<string, string | number | undefined>);
  return api.get<TopProductsResponse>(`/statistics/products/top${qs}`);
}

/**
 * Top catégories par nombre de plats vendus.
 */
export async function getTopCategories(params: ProductsStatsQueryParams = {}): Promise<TopCategoriesResponse> {
  const qs = buildQueryString(params as Record<string, string | number | undefined>);
  return api.get<TopCategoriesResponse>(`/statistics/products/top-categories${qs}`);
}

/**
 * Comparaison de performances produits entre deux périodes.
 */
export async function getProductsComparison(
  params: ProductsComparisonQueryParams,
): Promise<ProductComparisonResponse> {
  const qs = buildQueryString(params as Record<string, string | number | undefined>);
  return api.get<ProductComparisonResponse>(`/statistics/products/comparison${qs}`);
}

/**
 * Répartition des ventes par restaurant.
 */
export async function getProductsByRestaurant(
  params: ProductsStatsQueryParams = {},
): Promise<ProductsByRestaurantResponse> {
  const qs = buildQueryString(params as Record<string, string | number | undefined>);
  return api.get<ProductsByRestaurantResponse>(`/statistics/products/by-restaurant${qs}`);
}

/**
 * Plats les plus commandés par zone géographique.
 */
export async function getProductsByZone(
  params: ProductsStatsQueryParams = {},
): Promise<ProductsByZoneResponse> {
  const qs = buildQueryString(params as Record<string, string | number | undefined>);
  return api.get<ProductsByZoneResponse>(`/statistics/products/by-zone${qs}`);
}

/**
 * Tendance des ventes quotidiennes (quantité + CA).
 */
export async function getSalesTrend(
  params: ProductsStatsQueryParams = {},
): Promise<SalesTrendResponse> {
  const qs = buildQueryString(params as Record<string, string | number | undefined>);
  return api.get<SalesTrendResponse>(`/statistics/products/sales-trend${qs}`);
}

/**
 * Répartition des ventes par canal (App vs Call Center).
 */
export async function getChannelBreakdown(
  params: ProductsStatsQueryParams = {},
): Promise<ChannelBreakdownResponse> {
  const qs = buildQueryString(params as Record<string, string | number | undefined>);
  return api.get<ChannelBreakdownResponse>(`/statistics/products/channel-breakdown${qs}`);
}

/**
 * Performance des produits en promotion vs réguliers.
 */
export async function getPromotionPerformance(
  params: ProductsStatsQueryParams = {},
): Promise<PromotionPerformanceResponse> {
  const qs = buildQueryString(params as Record<string, string | number | undefined>);
  return api.get<PromotionPerformanceResponse>(`/statistics/products/promotion-performance${qs}`);
}
