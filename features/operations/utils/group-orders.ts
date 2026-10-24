import { differenceInMinutes } from 'date-fns';

import { DeliveryService, type Order, OrderStatus } from '../../orders/types/order.types';

import {
  approcheLivreur,
  courseDeCommande,
  etatCourse,
  livraisonsCommencees,
  positionConnue,
  positionRestaurant,
  referencesARemettre,
  retenueEnCours,
  type CommandeOperations,
  type CourseOperations,
  type EtatCourse,
} from './suivi-course';
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

/** Course de la commande (relation `delivery.course` de `operations/active`), ou null. */
function getCourseFromOrder(order: Order): CourseOperations | null {
  return courseDeCommande(order as unknown as CommandeOperations);
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
          course,
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
// COLONNE « PRÊTES » (demande du 24/10 au soir)
// ============================================================

/** Statuts d'une commande encore au restaurant (cuisine ou comptoir). */
const AU_RESTAURANT = new Set<string>([
  OrderStatus.PENDING,
  OrderStatus.ACCEPTED,
  OrderStatus.IN_PROGRESS,
  OrderStatus.READY,
]);

/**
 * Courses retenues au comptoir pour une commande en cuisine, sans aucune
 * commande prête (livreur encore au restaurant après le premier retrait,
 * commande ajoutée pas encore prête) : un groupe en-tête seul, comme à la
 * caisse, sinon la retenue n'apparaîtrait nulle part.
 */
export function groupesRetenusSansCommandePrete(
  commandes: readonly Order[],
  groupes: readonly IOrderGroup[],
  maintenant: Date,
): IOrderGroup[] {
  const dejaLa = new Set(groupes.map((g) => g.courseId).filter(Boolean));
  const resultat = new Map<string, IOrderGroup>();
  for (const o of commandes) {
    const course = getCourseFromOrder(o);
    if (!course || dejaLa.has(course.id) || resultat.has(course.id)) continue;
    if (!retenueEnCours(course, maintenant)) continue;
    resultat.set(course.id, {
      key: `course-${course.id}`,
      courseId: course.id,
      courseReference: course.reference ?? null,
      pickupCode: course.pickup_code ?? null,
      deliveryService: o.delivery_service,
      course,
      orders: [],
    });
  }
  return Array.from(resultat.values());
}

/**
 * Commandes d'une course encore au restaurant, telles que l'écran les
 * connaît : les prêtes d'abord, puis celles en cuisine (« En préparation »),
 * les plus anciennes d'abord. Ce sont les lignes du groupe de la course.
 */
export function commandesAuRestaurantDeLaCourse(courseId: string, commandes: readonly Order[]): Order[] {
  return commandes
    .filter((o) => {
      if (!AU_RESTAURANT.has(o.status)) return false;
      const livraison = (o as unknown as CommandeOperations).delivery;
      return livraison?.course?.id === courseId && livraison.statut !== 'CANCELLED';
    })
    .sort((a, b) => {
      const pa = a.status === OrderStatus.READY ? 0 : 1;
      const pb = b.status === OrderStatus.READY ? 0 : 1;
      if (pa !== pb) return pa - pb;
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    });
}

/** Rang de l'état d'une course dans la colonne « Prêtes ». */
const RANG_ETAT: Partial<Record<EtatCourse, number>> = {
  AU_COMPTOIR: 0,
  PARTI_SANS_SAC: 0,
  EN_ROUTE: 1,
  TURBO: 3,
};

/**
 * Ordre de la colonne « Prêtes » : livreur au restaurant (et sac oublié),
 * puis en route (arrivée la plus proche d'abord), puis recherche et offre,
 * puis Turbo, puis les commandes sans course (à emporter, sur place). À
 * égalité, la commande prête depuis le plus longtemps d'abord.
 *
 * L'état est celui de la dernière position connue par le serveur : l'en-tête
 * du groupe, lui, suit aussi la position en direct du livreur.
 */
export function ordonnerGroupesPretes(
  groupes: readonly IOrderGroup[],
  ctx: { maintenant: Date; commandes: readonly Order[] },
): IOrderGroup[] {
  const toutes = ctx.commandes as unknown as CommandeOperations[];
  const cle = (g: IOrderGroup): [number, number, number] => {
    const pretes = g.orders.map((o) => (o.ready_at ? Date.parse(o.ready_at) : Number.NaN)).filter(Number.isFinite);
    const plusAncienne = pretes.length > 0 ? Math.min(...pretes) : Number.MAX_SAFE_INTEGER;
    const course = g.course ?? null;
    if (!course) return [4, 0, plusAncienne];
    const restaurant = positionRestaurant(
      course.restaurant,
      ...g.orders.map((o) => (o as unknown as CommandeOperations).restaurant),
    );
    const position = positionConnue(course.deliverer);
    const aRemettre = referencesARemettre(course.id, toutes);
    const etat = etatCourse(course, {
      maintenant: ctx.maintenant,
      position,
      restaurant,
      livraisonsCommencees: livraisonsCommencees(course.id, toutes),
      resteARemettre: aRemettre.length > 0,
      referencesARemettre: aRemettre,
      service: g.deliveryService,
    }).etat;
    const r = RANG_ETAT[etat] ?? 2;
    if (r !== 1) return [r, 0, plusAncienne];
    const arrivee = approcheLivreur({
      arriveeServeur: course.arrivee_estimee,
      position,
      restaurant,
      maintenant: ctx.maintenant,
    }).arrivee;
    return [1, arrivee ? arrivee.getTime() : Number.MAX_SAFE_INTEGER, plusAncienne];
  };
  return groupes
    .map((g) => ({ g, k: cle(g) }))
    .sort((a, b) => a.k[0] - b.k[0] || a.k[1] - b.k[1] || a.k[2] - b.k[2])
    .map(({ g }) => g);
}
