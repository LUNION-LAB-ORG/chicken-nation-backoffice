import { api } from '@/services/api';
import { getHumanReadableError } from '@/utils/errorMessages';

import type {
  AssignRestaurantPayload,
  Livreur,
  LivreurAvecPlannings,
  LivreursListResponse,
  LivreursQueryFilters,
  RejectLivreurPayload,
  SuspendLivreurPayload,
} from '../types/livreur.types';

const ENDPOINT = '/deliverers';

const buildQueryString = (filters: LivreursQueryFilters): string => {
  const params = new URLSearchParams();
  if (filters.status) params.append('status', filters.status);
  if (filters.restaurant_id) params.append('restaurant_id', filters.restaurant_id);
  if (filters.search) params.append('search', filters.search);
  if (filters.page) params.append('page', String(filters.page));
  if (filters.limit) params.append('limit', String(filters.limit));
  const qs = params.toString();
  return qs ? `?${qs}` : '';
};

const safeCall = async <T>(fn: () => Promise<T>): Promise<T> => {
  try {
    return await fn();
  } catch (error) {
    throw new Error(getHumanReadableError(error));
  }
};

// ============================================================
// LECTURE
// ============================================================

export const getAllLivreurs = (filters: LivreursQueryFilters = {}) =>
  safeCall(() => api.get<LivreursListResponse>(`${ENDPOINT}${buildQueryString(filters)}`, true));

export const getLivreurById = (id: string) =>
  safeCall(() => api.get<Livreur>(`${ENDPOINT}/${id}`, true));

// ============================================================
// CYCLE DE VIE (transitions de statut)
// ============================================================

/** Restaurant choisi dans la fenêtre de validation (09/11) : rattaché et ajouté à ses plannings. */
const corpsRestaurant = (restaurantId?: string) => (restaurantId ? { restaurant_id: restaurantId } : {});

export const validateLivreur = (id: string, restaurantId?: string) =>
  safeCall(() => api.patch<LivreurAvecPlannings>(`${ENDPOINT}/${id}/validate`, corpsRestaurant(restaurantId), true));

export const rejectLivreur = (id: string, payload: RejectLivreurPayload) =>
  safeCall(() => api.patch<Livreur>(`${ENDPOINT}/${id}/reject`, payload, true));

export const suspendLivreur = (id: string, payload: SuspendLivreurPayload) =>
  safeCall(() => api.patch<Livreur>(`${ENDPOINT}/${id}/suspend`, payload, true));

export const reactivateLivreur = (id: string) =>
  safeCall(() => api.patch<Livreur>(`${ENDPOINT}/${id}/reactivate`, {}, true));

export const forceActivateLivreur = (id: string, restaurantId?: string) =>
  safeCall(() => api.patch<LivreurAvecPlannings>(`${ENDPOINT}/${id}/force-activate`, corpsRestaurant(restaurantId), true));

/** Réponse de « Débloquer » : le texte vient du serveur. */
export interface ReponseDeblocage {
  /** La pause automatique a été levée par ce geste. */
  debloque: boolean;
  /** Il est dans la file : il reçoit de nouveau des courses. */
  disponible: boolean;
  message: string;
}

/**
 * « Débloquer » (10/11, administrateur et centre d'appels) : lève la pause
 * automatique d'un livreur (refus répétés) avant son heure ; libre, il
 * reçoit de nouveau des courses sans rien faire sur son téléphone.
 */
export const debloquerLivreur = (id: string) =>
  safeCall(() => api.patch<ReponseDeblocage>(`${ENDPOINT}/${id}/debloquer`, {}, true));

// ============================================================
// AFFECTATION & SUPPRESSION
// ============================================================

export const assignRestaurantToLivreur = (id: string, payload: AssignRestaurantPayload) =>
  safeCall(() => api.patch<LivreurAvecPlannings>(`${ENDPOINT}/${id}/assign-restaurant`, payload, true));

export const softDeleteLivreur = (id: string) =>
  safeCall(() => api.delete<{ id: string; deleted: boolean }>(`${ENDPOINT}/${id}`, true));
