import { api } from '../../../src/services/api';
import {
  DeliveryStatsQueryParams,
  DeliveryOverviewResponse,
  DeliveryFeesBreakdownResponse,
  DeliveryByZoneResponse,
  DeliveryPerformanceResponse,
} from '../types/delivery-stats.types';

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
 * Vue d'ensemble livraison : total commandes, CA, frais collectés.
 */
export async function getDeliveryOverview(
  params: DeliveryStatsQueryParams = {},
): Promise<DeliveryOverviewResponse> {
  const qs = buildQueryString(params as Record<string, string | number | undefined>);
  return api.get<DeliveryOverviewResponse>(`/statistics/delivery/overview${qs}`);
}

/**
 * Décomposition des frais de livraison par tranche.
 */
export async function getDeliveryFeesBreakdown(
  params: DeliveryStatsQueryParams = {},
): Promise<DeliveryFeesBreakdownResponse> {
  const qs = buildQueryString(params as Record<string, string | number | undefined>);
  return api.get<DeliveryFeesBreakdownResponse>(`/statistics/delivery/fees-breakdown${qs}`);
}

/**
 * Top zones de livraison avec CA et coordonnées GPS.
 */
export async function getDeliveryByZone(
  params: DeliveryStatsQueryParams = {},
): Promise<DeliveryByZoneResponse> {
  const qs = buildQueryString(params as Record<string, string | number | undefined>);
  return api.get<DeliveryByZoneResponse>(`/statistics/delivery/by-zone${qs}`);
}

/**
 * Performance de livraison : temps moyen, taux de ponctualité.
 */
export async function getDeliveryPerformance(
  params: DeliveryStatsQueryParams = {},
): Promise<DeliveryPerformanceResponse> {
  const qs = buildQueryString(params as Record<string, string | number | undefined>);
  return api.get<DeliveryPerformanceResponse>(`/statistics/delivery/performance${qs}`);
}
