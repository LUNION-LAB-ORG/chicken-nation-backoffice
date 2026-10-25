import { differenceInMinutes } from 'date-fns';

import { DeliveryService, type Order, OrderStatus } from '../../orders/types/order.types';

import {
  LATE_READY_THRESHOLD_MIN,
  OVERDUE_COLLECTED_UNPAID_MIN,
  type IOperationsBuckets,
  type IOrderGroup,
} from '../types/operations.types';

/**
 * Est-ce qu'une Order READY est "en retard" (attend un livreur depuis trop longtemps) ?
 */
export function isReadyLate(order: Order): boolean {
  if (order.status !== OrderStatus.READY) return false;
  const readyAt = order.ready_at ? new Date(order.ready_at) : null;
  if (!readyAt) return false;
  return differenceInMinutes(new Date(), readyAt) >= LATE_READY_THRESHOLD_MIN;
}

/**
 * Est-ce qu'une Order COLLECTED non payée traîne depuis trop longtemps sans
 * être encaissée ? Le livreur doit rentrer au restaurant et faire versement.
 */
export function isCollectedUnpaidOverdue(order: Order): boolean {
  if (order.status !== OrderStatus.COLLECTED) return false;
  if (order.paied) return false;
  const collectedAt = order.collected_at ? new Date(order.collected_at) : null;
  if (!collectedAt) return false;
  return differenceInMinutes(new Date(), collectedAt) >= OVERDUE_COLLECTED_UNPAID_MIN;
}

/**
 * Une commande est "en retard" si elle est READY depuis trop longtemps OU si
 * elle est COLLECTED non payée depuis trop longtemps. C'est l'unique notion
 * de "problème" affichée à l'opérateur — matérialisée par l'anneau rouge sur
 * la card et le badge rouge sur l'onglet correspondant.
 */
export function isOrderLate(order: Order): boolean {
  return isReadyLate(order) || isCollectedUnpaidOverdue(order);
}

/** Accès defensif à delivery.course sans casser si propriété absente */
function getCourseFromOrder(order: Order): { id: string; reference: string; pickup_code: string } | null {
  // La relation delivery.course est fournie par le backend operations/active
  const delivery = (order as unknown as { delivery?: { course?: { id: string; reference: string; pickup_code: string } } }).delivery;
  return delivery?.course ?? null;
}

/**
 * Répartit les orders actives en 3 buckets logiques (par présence physique de
 * la commande) — alimentent les 2 onglets de la page Opérations :
 *
 *  - aPreparer    : ACCEPTED + IN_PROGRESS (+ PENDING défensif)            ┐ onglet
 *  - pretesGroupes: READY, groupées par course.id (multi-commande) ou solo ┘ "Au restaurant"
 *
 *  - recuperees   : PICKED_UP (tous types) + COLLECTED non payée            ─ onglet
 *                                                                            "Hors restaurant"
 *
 * Les retards (READY > 30 min, COLLECTED non payée > seuil) restent dans leur
 * bucket naturel : ils sont signalés par `isOrderLate()` (anneau rouge sur la
 * card + badge rouge sur l'onglet). C'était auparavant un bucket "problemes"
 * séparé, désormais fondu dans son onglet logique pour ne plus disperser
 * l'attention de l'opérateur.
 *
 * Note : COLLECTED payée / COMPLETED / CANCELLED = terminée → hors scope.
 */
export function groupOrdersForOperations(orders: Order[]): IOperationsBuckets {
  const aPreparer: Order[] = [];
  const pretesMap = new Map<string, IOrderGroup>();
  const recuperees: Order[] = [];

  for (const order of orders) {
    // 1. Hors restaurant : PICKED_UP (en route) + COLLECTED non payée (livrée
    //    mais pas encore encaissée — le livreur revient au resto avec l'argent).
    if (order.status === OrderStatus.PICKED_UP) {
      recuperees.push(order);
      continue;
    }
    if (order.status === OrderStatus.COLLECTED && !order.paied) {
      recuperees.push(order);
      continue;
    }

    // 2. Au restaurant - À préparer
    if (
      order.status === OrderStatus.PENDING ||
      order.status === OrderStatus.ACCEPTED ||
      order.status === OrderStatus.IN_PROGRESS
    ) {
      aPreparer.push(order);
      continue;
    }

    // 3. Au restaurant - Prêtes (groupées par course pour les multi-commande)
    if (order.status === OrderStatus.READY) {
      const course = getCourseFromOrder(order);
      const groupKey = course?.id ? `course-${course.id}` : `solo-${order.id}`;
      const existing = pretesMap.get(groupKey);
      if (existing) {
        existing.orders.push(order);
      } else {
        pretesMap.set(groupKey, {
          key: groupKey,
          courseId: course?.id ?? null,
          courseReference: course?.reference ?? null,
          pickupCode: course?.pickup_code ?? null,
          deliveryService: order.delivery_service,
          orders: [order],
        });
      }
      continue;
    }

    // COLLECTED payée / COMPLETED / CANCELLED → hors scope live-ops, on ignore
  }

  return {
    aPreparer,
    pretesGroupes: Array.from(pretesMap.values()),
    recuperees,
  };
}
