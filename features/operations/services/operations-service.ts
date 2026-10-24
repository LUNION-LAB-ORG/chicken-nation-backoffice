import { api } from '@/services/api';

import type { Course } from '../../courses/types/course.types';
import type { Order } from '../../orders/types/order.types';
import { messageErreurOperations } from '../utils/message-erreur';

const BASE_ORDERS = '/orders';
const BASE_OPERATIONS = '/courses/operations';

/**
 * Erreur du serveur rendue lisible : SON message (« Aucune course en cours
 * avec ce code… », « La commande ORD-… est encore « En préparation »… »)
 * à la place du texte des promotions de `getHumanReadableError` (incident
 * du 22/10). Le statut suit, pour un écran qui veut réagir à un 409.
 */
const safeCall = async <T>(fn: () => Promise<T>): Promise<T> => {
  try {
    return await fn();
  } catch (error) {
    const status = (error as { status?: unknown } | null)?.status;
    throw Object.assign(
      new Error(messageErreurOperations(error)),
      typeof status === 'number' ? { status } : {},
    );
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

/**
 * Preview d'une course pour un pickup_code, avant validation caissière.
 * `restaurantId` : restaurant où chercher (voir `utils/code-retrait.ts`) ;
 * absent, le serveur prend celui du membre rattaché, ou tous les restaurants.
 */
export const getCourseByPickupCode = (code: string, restaurantId?: string) =>
  safeCall(() =>
    api.get<Course>(
      `${BASE_OPERATIONS}/by-pickup-code/${encodeURIComponent(code)}${
        restaurantId ? `?restaurant_id=${encodeURIComponent(restaurantId)}` : ''
      }`,
      true,
    ),
  );

/**
 * Suivi de la livraison d'une commande pour le tiroir (livreur, étapes et
 * durées), `GET /orders/:id/livraison`. Réponse brute : elle est rendue sûre
 * par `lireLivraison` (`utils/suivi-livraison.ts`).
 */
export const getLivraisonCommande = (orderId: string) =>
  safeCall(() => api.get<unknown>(`${BASE_ORDERS}/${encodeURIComponent(orderId)}/livraison`, true));

// ============================================================
// MUTATIONS
// ============================================================

/**
 * Valide la récupération (caissière) : Course → IN_DELIVERY, Orders → PICKED_UP.
 * `restaurantId` part dans le corps (`restaurant_id`), seulement s'il est connu.
 */
export const validatePickup = (pickup_code: string, restaurantId?: string) =>
  safeCall(() =>
    api.post<Course>(
      `${BASE_OPERATIONS}/validate-pickup`,
      restaurantId ? { pickup_code, restaurant_id: restaurantId } : { pickup_code },
      true,
    ),
  );

/**
 * Caissière encaisse le livreur (paiement espèce) :
 *   Order.paied = true + paied_at = now + status → COMPLETED (si pas déjà).
 */
export const markOrderPaidCash = (orderId: string, amount?: number) =>
  safeCall(() =>
    api.post<Order>(`${BASE_ORDERS}/${orderId}/mark-paid-cash`, amount !== undefined ? { amount } : {}, true),
  );
