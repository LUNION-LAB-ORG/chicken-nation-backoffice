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
} from '../types/clients-stats.types';

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
 * Fiche analytique complète d'un client (canal, LTV, fréquence, top plats).
 */
export async function getClientAnalyticsProfile(
  clientId: string,
): Promise<ClientAnalyticsProfileResponse> {
  return api.get<ClientAnalyticsProfileResponse>(`/statistics/clients/${clientId}/analytics`);
}
