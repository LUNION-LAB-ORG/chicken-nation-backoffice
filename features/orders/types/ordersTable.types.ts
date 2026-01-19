import { TypeTable } from "./order.types";
import { Paiement } from "./paiement.types";

/**
 * Représente un item d'une commande dans le tableau
 */
export interface OrderTableItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  image: string;
  epice: boolean;
  supplements: string;
  supplementsPrice: number;
}

/**
 * Statuts possibles d'une commande dans l'interface utilisateur
 */
export type OrderTableStatus =
  "NOUVELLE" |
  "EN COURS" |
  "EN PRÉPARATION" |
  "PRÊT" |
  "COLLECTÉE" |
  "LIVRÉE" |
  "ANNULÉE" |
  "TERMINÉE"


/**
 * Types de commande affichés dans l'interface
 */
export type OrderTableType = "À livrer" | "À récupérer" | "À table";

/**
 * Statut de paiement dans l'interface
 */
export type PaymentStatus = "PAID" | "UNPAID" | "REFUNDED" | "TO_REFUND" | "PENDING" | "FAILED";

/**
 * Interface principale pour les commandes affichées dans le tableau
 * Représente une commande API mappée pour l'affichage UI
 */
export interface OrderTable {
  // ========== IDENTIFIANTS ==========
  id: string;
  reference: string;

  // ========== CLIENT ==========
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  customerId: string;

  // ========== DATES ==========
  date: string;
  createdAt: string;
  updatedAt: string;
  paiedAt: string | null;
  readyAt: string | null;
  pickedUpAt: string | null;
  collectedAt: string | null;
  completedAt: string | null;

  // ========== STATUT ==========
  status: OrderTableStatus;
  orderType: OrderTableType;

  // ========== MONTANTS ==========
  amount: number;
  netAmount: number;
  deliveryFee: number;
  tax: number;
  discount: number;

  // ========== LIVRAISON/TABLE ==========
  address: string;
  deliveryService: string;
  estimatedDeliveryTime: string | null;
  estimatedPreparationTime: string | null;
  tableType: TypeTable | null;
  places: number | null;

  // ========== RESTAURANT ==========
  restaurantId: string;
  restaurantName: string;

  // ========== ITEMS ==========
  items: OrderTableItem[];

  // ========== PAIEMENT ==========
  paied: boolean;
  paymentStatus: PaymentStatus;
  paymentMethod: string;
  paymentSource: string;
  paymentMode: string;
  paiements: Paiement[];

  // ========== BONUS/PROMO ==========
  points: number;
  codePromo: string | null;
  promotionId: string | null;
  zoneId: string | null;

  // ========== NOTES ==========
  note: string | null;

  // ========== MÉTADONNÉES ==========
  auto: boolean;
}