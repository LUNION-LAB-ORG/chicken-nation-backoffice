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
function isReadyLate(order: Order): boolean {
  if (order.status !== OrderStatus.READY) return false;
  const readyAt = order.ready_at ? new Date(order.ready_at) : null;
  if (!readyAt) return false;
  return differenceInMinutes(new Date(), readyAt) >= LATE_READY_THRESHOLD_MIN;
}

/**
 * Est-ce qu'une Order COLLECTED non payée traîne depuis trop longtemps sans
 * être encaissée ? Le livreur doit rentrer au restaurant et faire versement
 * — si ça dépasse le seuil, on la bascule en Problèmes.
 */
function isCollectedUnpaidOverdue(order: Order): boolean {
  if (order.status !== OrderStatus.COLLECTED) return false;
  if (order.paied) return false;
  const collectedAt = order.collected_at ? new Date(order.collected_at) : null;
  if (!collectedAt) return false;
  return differenceInMinutes(new Date(), collectedAt) >= OVERDUE_COLLECTED_UNPAID_MIN;
}

/** Accès defensif à delivery.course sans casser si propriété absente */
function getCourseFromOrder(order: Order): { id: string; reference: string; pickup_code: string } | null {
  // La relation delivery.course est fournie par le backend operations/active
  const delivery = (order as unknown as { delivery?: { course?: { id: string; reference: string; pickup_code: string } } }).delivery;
  return delivery?.course ?? null;
}

/**
 * Répartit les orders actives dans les 4 sections de la page Opérations :
 *
 *  - À préparer  : ACCEPTED + IN_PROGRESS (+ PENDING défensif)
 *  - Prêtes      : READY (pas en retard), groupées par course.id si multi-commande, sinon solo
 *  - Collectées  : PICKED_UP (tous types, peu importe le paiement — le non-payé OFFLINE est
 *                  l'état NORMAL tant que le livreur n'a pas atteint le client)
 *                  + COLLECTED non payée **récente** (livreur n'a pas encore ramené l'argent,
 *                    grâce à `confirmDelivery` backend qui reste COLLECTED si non payée)
 *  - Problèmes   : READY en retard (> 30 min sans livreur)
 *                  + COLLECTED non payée **en retard** (> `OVERDUE_COLLECTED_UNPAID_MIN` min)
 *                    — le livreur tarde à encaisser, la caissière doit aller chercher
 *
 * Note : COLLECTED payée = terminée, on ne l'affiche plus (hors scope « live-ops »).
 */
export function groupOrdersForOperations(orders: Order[]): IOperationsBuckets {
  const aPreparer: Order[] = [];
  const pretesMap = new Map<string, IOrderGroup>();
  const recuperees: Order[] = [];
  const problemes: Order[] = [];

  for (const order of orders) {
    // 1. Problèmes : vraies anomalies (READY en retard, COLLECTED non payée depuis longtemps)
    if (isReadyLate(order) || isCollectedUnpaidOverdue(order)) {
      problemes.push(order);
      continue;
    }

    // 2. Collectées : PICKED_UP (tous types) + COLLECTED non payée récente
    if (order.status === OrderStatus.PICKED_UP) {
      recuperees.push(order);
      continue;
    }
    if (order.status === OrderStatus.COLLECTED && !order.paied) {
      // Livrée mais pas encore encaissée → reste en Collectées le temps que le livreur
      // rentre au restaurant. Passe en Problèmes une fois le seuil `OVERDUE_...` dépassé
      // (géré par la branche 1 ci-dessus).
      recuperees.push(order);
      continue;
    }

    // 3. À préparer
    if (
      order.status === OrderStatus.PENDING ||
      order.status === OrderStatus.ACCEPTED ||
      order.status === OrderStatus.IN_PROGRESS
    ) {
      aPreparer.push(order);
      continue;
    }

    // 4. Prêtes (READY non en retard, sinon déjà shiftée en Problèmes ci-dessus)
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
    problemes,
  };
}
