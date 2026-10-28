import { api } from '@/services/api';

import type { Course } from '../../courses/types/course.types';
import type { Order } from '../../orders/types/order.types';
import { estRouteAbsente, messageErreurOperations } from '../utils/message-erreur';
import type { ReponseSacRapporte } from '../utils/sac-a-rapporter';

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
      // Route inconnue du serveur (pas encore à jour) : l'appelant se replie.
      estRouteAbsente(error) ? { routeAbsente: true } : {},
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
 * Aperçu d'une course par son code (ancienne route, repli tant que le serveur
 * n'a pas `GET /courses/operations/:id`). `restaurantId` : celui de la course
 * affichée ; absent, le serveur prend celui du membre rattaché, ou tous.
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
// RÉCUPÉRATION PAR LA COURSE (sans saisie du code, demande du 24/10 au soir)
// ============================================================

/** Ce que l'écran connaît de la course à remettre : de quoi se replier sur le code. */
export interface CourseARemettre {
  id: string;
  pickup_code?: string | null;
  restaurant_id?: string | null;
}

/** Aperçu de la course à remettre, par son identifiant (`GET /courses/operations/:id`). */
export const apercuCourse = (courseId: string) =>
  safeCall(() => api.get<Course>(`${BASE_OPERATIONS}/${encodeURIComponent(courseId)}`, true));

/**
 * Confirme la récupération (`POST /courses/operations/:id/recuperation`) :
 * les commandes `orderIds` passent récupérées. Renvoie la course remise.
 */
export const confirmerRecuperation = (courseId: string, orderIds: readonly string[]) =>
  safeCall(() =>
    api.post<Course>(
      `${BASE_OPERATIONS}/${encodeURIComponent(courseId)}/recuperation`,
      { order_ids: [...orderIds] },
      true,
    ),
  );

const routeAbsente = (erreur: unknown) => (erreur as { routeAbsente?: unknown } | null)?.routeAbsente === true;

/**
 * Aperçu pour la fenêtre de récupération : la route par identifiant, ou,
 * tant que le serveur ne la connaît pas (404 de route), l'ancienne route à
 * code avec le code et le restaurant de la course déjà à l'écran.
 */
export async function apercuRecuperation(course: CourseARemettre): Promise<Course> {
  try {
    return await apercuCourse(course.id);
  } catch (erreur) {
    if (!routeAbsente(erreur) || !course.pickup_code) throw erreur;
    return getCourseByPickupCode(course.pickup_code, course.restaurant_id ?? undefined);
  }
}

/**
 * Confirmation de la fenêtre : la route par identifiant, ou l'ancienne
 * validation par code (qui remet toutes les commandes prêtes de la course)
 * tant que le serveur ne la connaît pas.
 */
export async function recupererCourse(course: CourseARemettre, orderIds: readonly string[]): Promise<Course> {
  try {
    return await confirmerRecuperation(course.id, orderIds);
  } catch (erreur) {
    if (!routeAbsente(erreur) || !course.pickup_code) throw erreur;
    return validatePickup(course.pickup_code, course.restaurant_id ?? undefined);
  }
}

// ============================================================
// SAC RAPPORTÉ (demande du 28/10)
// ============================================================

/**
 * Le livreur a rapporté le sac d'une livraison qu'il a annulée
 * (`POST /courses/operations/commandes/:orderId/sac-rapporte`, corps vide) :
 * la commande redevient prête et repart dans une nouvelle course. Rejeu :
 * 200 avec `deja: true`. Refus (404, 403, 409) : le texte du serveur.
 */
export const sacRapporte = (orderId: string) =>
  safeCall(() =>
    api.post<ReponseSacRapporte>(
      `${BASE_OPERATIONS}/commandes/${encodeURIComponent(orderId)}/sac-rapporte`,
      {},
      true,
    ),
  );

// ============================================================
// MUTATIONS
// ============================================================

/**
 * Valide la récupération par le code (ancienne route, repli) : Course →
 * IN_DELIVERY, Orders → PICKED_UP. `restaurantId` part dans le corps
 * (`restaurant_id`), seulement s'il est connu.
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
