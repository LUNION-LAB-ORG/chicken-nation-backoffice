import { differenceInMinutes } from 'date-fns';

import { DeliveryService, type Order, OrderStatus, OrderType } from '../../orders/types/order.types';

import { courseDeCommande, livraisonDeCommande, type CommandeOperations, type CourseOperations } from './suivi-course';
import {
  LATE_READY_THRESHOLD_MIN,
  OVERDUE_COLLECTED_UNPAID_MIN,
  type IGroupeLivreur,
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

/** Course annulée ou terminée : plus personne ne vient chercher ses sacs. */
const COURSES_FINIES = new Set(['CANCELLED', 'COMPLETED']);

/**
 * Course sous laquelle ranger une commande prête : celle de sa livraison,
 * sauf si cette livraison est annulée (course annulée, commande détachée
 * d'une course partie, annulation Turbo d'une commande du groupe) ou si la
 * course est annulée ou terminée. La commande est alors une carte seule :
 * le groupe de la course ne la listerait pas, et « Confirmer la
 * récupération » serait refusé par le serveur. « Aucun livreur trouvé »
 * (course expirée) garde son groupe.
 */
export function courseDeLaPrete(order: Order): CourseOperations | null {
  const commande = order as unknown as CommandeOperations;
  if (livraisonDeCommande(commande)?.statut === 'CANCELLED') return null;
  const course = courseDeCommande(commande);
  return course && !COURSES_FINIES.has(course.statut) ? course : null;
}

/**
 * Quelqu'un à qui remettre les sacs (« Confirmer la récupération ») : un
 * livreur a accepté, ou Turbo a la course. Personne pendant la recherche,
 * ni sur une course sans livreur trouvé, annulée ou terminée (le serveur
 * garde le livreur d'une course annulée et répondrait 409). Même règle que
 * la caisse.
 */
export function quelquUnARemettre(
  course: { statut: string; deliverer_id?: string | null; turbo_escalated_at?: string | null } | null | undefined,
): boolean {
  if (!course) return false;
  if (course.statut === 'CANCELLED' || course.statut === 'EXPIRED' || course.statut === 'COMPLETED') return false;
  return !!course.deliverer_id || !!course.turbo_escalated_at;
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
      const course = courseDeLaPrete(order);
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

// ============================================================
// « HORS RESTAURANT » GROUPÉ PAR LIVREUR (demande du 24/10)
// ============================================================

const texte = (v: unknown): string | null => (typeof v === 'string' && v.trim() ? v.trim() : null);

const instant = (iso: string | null | undefined): number => {
  const t = iso ? Date.parse(iso) : Number.NaN;
  return Number.isNaN(t) ? 0 : t;
};

/**
 * Clé du livreur d'une commande sortie :
 *  - livreur Chicken Nation : `livreur-{deliverer_id}` (une commande livrée à
 *    encaisser d'une course finie rejoint le même livreur : c'est lui qui
 *    rapporte l'argent) ;
 *  - Turbo : `turbo-{turbo_courier_id}`, sinon son nom, sinon la course ;
 *  - personne (à emporter, sur place, commande sans course) : null, la
 *    commande reste une carte seule, comme avant.
 */
export function cleLivreur(order: Order): string | null {
  const commande = order as unknown as CommandeOperations;
  const course = courseDeCommande(commande);
  if (!course) return null;
  if (course.deliverer_id) return `livreur-${course.deliverer_id}`;
  if (course.turbo_escalated_at || order.delivery_service === DeliveryService.TURBO) {
    const livraison = livraisonDeCommande(commande);
    const id = texte(livraison?.turbo_courier_id);
    if (id) return `turbo-${id}`;
    const nom = texte(livraison?.turbo_courier_name);
    if (nom) return `turbo-${nom.toLowerCase()}`;
    return `turbo-${course.id}`;
  }
  return null;
}

/** Commande encore en route vers le client. */
const enRoute = (o: Order): boolean => o.status === OrderStatus.PICKED_UP && o.type === OrderType.DELIVERY;

/**
 * Course montrée en tête du groupe : celle des commandes encore en route, la
 * plus récente ; sinon (il ne reste que de l'argent à rapporter) la plus
 * récente du groupe.
 */
export function courseDuLivreur(orders: readonly Order[]): CourseOperations | null {
  let choisie: CourseOperations | null = null;
  let rang = -1;
  let quand = Number.NEGATIVE_INFINITY;
  for (const o of orders) {
    const course = courseDeCommande(o as unknown as CommandeOperations);
    if (!course) continue;
    const r = enRoute(o) ? 1 : 0;
    const t = instant(course.picked_up_at ?? course.parti_at ?? course.created_at ?? null);
    if (r > rang || (r === rang && t > quand)) {
      choisie = course;
      rang = r;
      quand = t;
    }
  }
  return choisie;
}

/**
 * Colonne « Hors restaurant » groupée par livreur, comme les commandes
 * prêtes le sont par course au restaurant. Ordre d'arrivée gardé : un groupe
 * prend la place de sa première commande, ses commandes gardent leur ordre.
 * Une commande sans livreur reste seule (`course` null).
 */
export function groupesHorsRestaurant(recuperees: readonly Order[]): IGroupeLivreur[] {
  const groupes: IGroupeLivreur[] = [];
  const parCle = new Map<string, IGroupeLivreur>();
  for (const o of recuperees) {
    const cle = cleLivreur(o);
    if (!cle) {
      groupes.push({ key: `solo-${o.id}`, course: null, deliveryService: o.delivery_service, orders: [o] });
      continue;
    }
    const existant = parCle.get(cle);
    if (existant) {
      existant.orders.push(o);
      continue;
    }
    const groupe: IGroupeLivreur = { key: cle, course: null, deliveryService: o.delivery_service, orders: [o] };
    parCle.set(cle, groupe);
    groupes.push(groupe);
  }
  for (const g of parCle.values()) g.course = courseDuLivreur(g.orders);
  return groupes;
}
