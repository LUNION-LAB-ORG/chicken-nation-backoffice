import { api } from '../../../src/services/api';
import {
  MarketingQueryParams,
  ChurnExportQueryParams,
  TopZonesQueryParams,
  PromoUsageResponse,
  PromotionsPerformanceResponse,
  TopZonesResponse,
  ChurnExportResponse,
} from '../types/marketing-stats.types';

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
 * Utilisation et performance des codes promos.
 * ROI d'une campagne Facebook ou d'influence.
 */
export async function getPromoUsage(
  params: MarketingQueryParams = {},
): Promise<PromoUsageResponse> {
  const qs = buildQueryString(params as Record<string, string | number | undefined>);
  return api.get<PromoUsageResponse>(`/statistics/marketing/promo-usage${qs}`);
}

/**
 * Performance globale de toutes les promotions.
 */
export async function getPromotionsPerformance(
  params: MarketingQueryParams = {},
): Promise<PromotionsPerformanceResponse> {
  const qs = buildQueryString(params as Record<string, string | number | undefined>);
  return api.get<PromotionsPerformanceResponse>(`/statistics/marketing/promotions-performance${qs}`);
}

/**
 * Top N zones pour le street marketing (flyers) avec coordonnées GPS.
 */
export async function getTopZones(
  params: TopZonesQueryParams = {},
): Promise<TopZonesResponse> {
  const qs = buildQueryString(params as Record<string, string | number | undefined>);
  return api.get<TopZonesResponse>(`/statistics/marketing/top-zones${qs}`);
}

/**
 * Export des clients en churn pour campagnes SMS/WhatsApp.
 */
export async function getChurnExport(
  params: ChurnExportQueryParams = {},
): Promise<ChurnExportResponse> {
  const qs = buildQueryString(params as Record<string, string | number | undefined>);
  return api.get<ChurnExportResponse>(`/statistics/marketing/churn-export${qs}`);
}
