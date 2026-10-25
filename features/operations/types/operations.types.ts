import type { DeliveryService, Order, OrderStatus } from '../../orders/types/order.types';

/** Onglets visuels de la page Opérations (regroupement par présence physique). */
export type OperationsTabKey = 'au_restaurant' | 'hors_restaurant';

/** @deprecated — ancien découpage 4 sections, conservé pour compat éventuelle. */
export type OperationsSectionKey = 'a_preparer' | 'pretes' | 'recuperees' | 'problemes';

/** Order enrichie avec infos Course pour l'affichage */
export type OrderForOperations = Order;

/** Group de commandes prêtes qui partagent la même course (chicken_nation multi) */
export interface IOrderGroup {
  /** Course ID si les orders sont groupées, `'solo-${orderId}'` sinon */
  key: string;
  /** Null si pas de course (TURBO ou solo) */
  courseId: string | null;
  /** Référence visible de la course (`CRS-...`) — null si solo */
  courseReference: string | null;
  /** Code retrait 3 chiffres (affiché au livreur) — null si solo */
  pickupCode: string | null;
  /** Service livraison (TURBO / FREE / CHICKEN_NATION) */
  deliveryService: DeliveryService;
  orders: Order[];
}

export interface IOperationsBuckets {
  aPreparer: Order[];
  pretesGroupes: IOrderGroup[];
  /**
   * Commandes qui ont quitté le restaurant :
   *  - PICKED_UP (tous types : DELIVERY en route, PICKUP emportée, TABLE servie)
   *  - COLLECTED non payée (livrée, livreur revient au resto avec l'argent)
   * Alimente l'onglet "Hors restaurant" + le KPI "En livraison" (filtré sur DELIVERY).
   */
  recuperees: Order[];
}

/** Seuil (min) au-delà duquel une Order READY est considérée "en retard" */
export const LATE_READY_THRESHOLD_MIN = 30;

/**
 * Seuil (min) après `collected_at` au-delà duquel une commande OFFLINE
 * livrée mais **non payée** est considérée comme problématique. Le livreur
 * devrait être rentré au restaurant et avoir versé l'argent bien avant.
 * Au-delà, la commande bascule de la colonne « Collectées » vers « Problèmes »
 * pour que la caissière aille la chercher.
 */
export const OVERDUE_COLLECTED_UNPAID_MIN = 60;

/** Considéré en attente de paiement problématique */
export const LATE_PAYMENT_STATUSES: OrderStatus[] = ['ACCEPTED', 'IN_PROGRESS'] as never;
