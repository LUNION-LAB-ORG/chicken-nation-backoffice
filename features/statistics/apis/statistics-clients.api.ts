import { api } from '../../../src/services/api';
import {
  ClientsStatsQueryParams,
  InactiveClientsQueryParams,
  ClientsOverviewResponse,
  ClientsAcquisitionResponse,
  ClientsRetentionResponse,
  TopClientsResponse,
  InactiveClientsResponse,
  ClientsByZoneResponse,
  ClientAnalyticsProfileResponse,
  LoyaltyDistributionResponse,
  PaymentMethodDistributionResponse,
  RevenueConcentrationResponse,
  BasketComparisonResponse,
} from '../types/clients-stats.types';

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
 * Vue d'ensemble clients : total, nouveaux vs récurrents, LTV, canaux.
 */
export async function getClientsOverview(
  params: ClientsStatsQueryParams = {},
): Promise<ClientsOverviewResponse> {
  const qs = buildQueryString(params as Record<string, string | number | undefined>);
  return api.get<ClientsOverviewResponse>(`/statistics/clients/overview${qs}`);
}

/**
 * Courbe journalière : nouveaux vs récurrents, App vs Call Center.
 */
export async function getClientsAcquisition(
  params: ClientsStatsQueryParams = {},
): Promise<ClientsAcquisitionResponse> {
  const qs = buildQueryString(params as Record<string, string | number | undefined>);
  return api.get<ClientsAcquisitionResponse>(`/statistics/clients/acquisition${qs}`);
}

/**
 * Taux de churn 30j / 60j, clients à risque, taux de rétention.
 */
export async function getClientsRetention(
  params: Pick<ClientsStatsQueryParams, 'restaurantId'> = {},
): Promise<ClientsRetentionResponse> {
  const qs = buildQueryString(params as Record<string, string | number | undefined>);
  return api.get<ClientsRetentionResponse>(`/statistics/clients/retention${qs}`);
}

/**
 * Top clients par CA avec canal préféré, panier moyen et fidélité.
 */
export async function getTopClients(
  params: ClientsStatsQueryParams = {},
): Promise<TopClientsResponse> {
  const qs = buildQueryString(params as Record<string, string | number | undefined>);
  return api.get<TopClientsResponse>(`/statistics/clients/top${qs}`);
}

/**
 * Clients inactifs depuis N jours, exportable pour campagnes SMS/WhatsApp.
 */
export async function getInactiveClients(
  params: InactiveClientsQueryParams = {},
): Promise<InactiveClientsResponse> {
  const qs = buildQueryString(params as Record<string, string | number | undefined>);
  return api.get<InactiveClientsResponse>(`/statistics/clients/inactive${qs}`);
}

/**
 * Répartition géographique des clients actifs.
 */
export async function getClientsByZone(
  params: ClientsStatsQueryParams = {},
): Promise<ClientsByZoneResponse> {
  const qs = buildQueryString(params as Record<string, string | number | undefined>);
  return api.get<ClientsByZoneResponse>(`/statistics/clients/by-zone${qs}`);
}

/**
 * Répartition par niveau de fidélité (STANDARD / PREMIUM / GOLD).
 */
export async function getLoyaltyDistribution(
  params: ClientsStatsQueryParams = {},
): Promise<LoyaltyDistributionResponse> {
  const qs = buildQueryString(params as Record<string, string | number | undefined>);
  return api.get<LoyaltyDistributionResponse>(`/statistics/clients/loyalty-distribution${qs}`);
}

/**
 * Répartition par méthode de paiement.
 */
export async function getPaymentMethodDistribution(
  params: ClientsStatsQueryParams = {},
): Promise<PaymentMethodDistributionResponse> {
  const qs = buildQueryString(params as Record<string, string | number | undefined>);
  return api.get<PaymentMethodDistributionResponse>(`/statistics/clients/payment-methods${qs}`);
}

/**
 * Concentration du CA (Pareto) : top 10/20/50%.
 */
export async function getRevenueConcentration(
  params: ClientsStatsQueryParams = {},
): Promise<RevenueConcentrationResponse> {
  const qs = buildQueryString(params as Record<string, string | number | undefined>);
  return api.get<RevenueConcentrationResponse>(`/statistics/clients/revenue-concentration${qs}`);
}

/**
 * Panier moyen : nouveaux clients vs récurrents.
 */
export async function getBasketComparison(
  params: ClientsStatsQueryParams = {},
): Promise<BasketComparisonResponse> {
  const qs = buildQueryString(params as Record<string, string | number | undefined>);
  return api.get<BasketComparisonResponse>(`/statistics/clients/basket-comparison${qs}`);
}

/**
 * Fiche analytique complète d'un client (canal, LTV, fréquence, top plats).
 */
export async function getClientAnalyticsProfile(
  clientId: string,
): Promise<ClientAnalyticsProfileResponse> {
  return api.get<ClientAnalyticsProfileResponse>(`/statistics/clients/${clientId}/analytics`);
}
