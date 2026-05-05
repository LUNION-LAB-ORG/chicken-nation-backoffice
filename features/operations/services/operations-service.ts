import { api } from '@/services/api';
import { getHumanReadableError } from '@/utils/errorMessages';

import type { Course } from '../../courses/types/course.types';
import type { Order } from '../../orders/types/order.types';

const BASE_ORDERS = '/orders';
const BASE_OPERATIONS = '/courses/operations';

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

/** Orders actives pour la page Opérations (ACCEPTED → COLLECTED, avec delivery+course). */
export const getActiveOperationsOrders = (restaurantId?: string) =>
  safeCall(() =>
    api.get<Order[]>(
      `${BASE_ORDERS}/operations/active${restaurantId ? `?restaurantId=${restaurantId}` : ''}`,
      true,
    ),
  );

/** Preview d'une course pour un pickup_code — avant validation caissière. */
export const getCourseByPickupCode = (code: string) =>
  safeCall(() => api.get<Course>(`${BASE_OPERATIONS}/by-pickup-code/${code}`, true));

// ============================================================
// MUTATIONS
// ============================================================

/** Valide la récupération (caissière) : Course → IN_DELIVERY, Orders → PICKED_UP. */
export const validatePickup = (pickup_code: string) =>
  safeCall(() => api.post<Course>(`${BASE_OPERATIONS}/validate-pickup`, { pickup_code }, true));

/**
 * Caissière encaisse le livreur (paiement espèce) :
 *   Order.paied = true + paied_at = now + status → COMPLETED (si pas déjà).
 */
export const markOrderPaidCash = (orderId: string, amount?: number) =>
  safeCall(() =>
    api.post<Order>(`${BASE_ORDERS}/${orderId}/mark-paid-cash`, amount !== undefined ? { amount } : {}, true),
  );
