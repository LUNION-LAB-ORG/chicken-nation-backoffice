import { OrderStatus, TypeTable } from "./order.types";
import { Paiement } from "./paiement.types";

/**
 * Représente un item d'une commande dans le tableau
 */
export interface OrderTableItem {
  id: string;
  dishId: string;
  name: string;
  quantity: number;
  price: number;
  image: string;
  epice: boolean;
  supplements: string;
  supplementsPrice: number;
  /** Données brutes des suppléments (pour le mode édition + marqueur « offert ») */
  rawSupplements?: { id: string; name: string; price: number; quantity?: number; offert?: boolean }[];
  /** Temps de préparation du plat, en minutes (paramétré dans la fiche menu). */
  cookingTime?: number | null;
  /**
   * MENUS COMPOSABLES : les choix retenus par le client, figés à la commande.
   * Tableau vide pour un plat ordinaire et pour toute commande antérieure.
   */
  options: { id: string; label: string; groupName: string; priceDelta: number }[];
  /**
   * Total FIGÉ de la ligne, options comprises. Repli sur l'ancien calcul pour
   * les commandes antérieures aux colonnes de prix figé.
   */
  lineTotal: number;
}

/**
 * Statuts possibles d'une commande dans l'interface utilisateur.
 *
 * Convention (alignée sur l'enum Prisma OrderStatus) :
 *  - "EN LIVRAISON" = PICKED_UP (livreur a pris la commande, DELIVERY uniquement)
 *  - "RÉCUPÉRÉE"    = COLLECTED (client a reçu / a récupéré la commande, tous types)
 *  - "TERMINÉE"     = COMPLETED (commande payée + récupérée, terminée)
 */
export type OrderTableStatus =
  "EN ATTENTE" |
  "NOUVELLE" |
  "EN PRÉPARATION" |
  "PRÊT" |
  "EN LIVRAISON" |
  "RÉCUPÉRÉE" |
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
  /**
   * Status brut côté backend (enum Prisma).
   * Source de vérité pour le workflow — préférer `rawStatus` à `status` dans
   * tout switch métier ; `status` est juste le libellé d'affichage.
   */
  rawStatus: OrderStatus;
  orderType: OrderTableType;

  // ========== MONTANTS ==========
  amount: number;
  netAmount: number;
  deliveryFee: number;
  /**
   * Frais PLEIN avant offre, remise appliquée, et zone retenue.
   *
   * ⚠️ Sans eux, l'écran ne peut pas dire POURQUOI une livraison est gratuite :
   * offre commerciale assumée, ou défaut de tarification. C'est exactement la
   * question restée sans réponse sur la commande de 22,6 km facturée
   * « Gratuite ».
   */
  deliveryFeeBase?: number;
  deliveryDiscount?: number;
  deliveryZoneId?: string | null;
  tax: number;
  discount: number;

  // ========== LIVRAISON/TABLE ==========
  address: string;
  /** Adresse brute JSON (pour le mode édition) */
  rawAddress: string | null;
  deliveryService: string;
  estimatedDeliveryTime: string | null;
  estimatedPreparationTime: string | null;
  tableType: TypeTable | null;
  places: number | null;

  // ========== RESTAURANT ==========
  restaurantId: string;
  restaurantName: string;
  /** Coordonnées du restaurant — pin « départ » de la carte de livraison. */
  restaurantLatitude?: number | null;
  restaurantLongitude?: number | null;

  // ========== ANNULATION TURBO (découplée) ==========
  /**
   * Renseigné quand Turbo a annulé la course/livraison de cette commande.
   * La commande reste vivante : le staff relance une livraison ou l'annule
   * manuellement. Affiché en bannière (drawer + détail).
   */
  courseCancellation?: { courseReference: string | null; reason: string } | null;

  // ========== ITEMS ==========
  items: OrderTableItem[];

  // ========== PAIEMENT ==========
  paied: boolean;
  paymentStatus: PaymentStatus;
  paymentMethod: string;
  paymentSource: string;
  paymentMode: string;
  paymentChannel: 'Restaurant' | 'Appli';
  paiements: Paiement[];

  // ========== BONUS/PROMO ==========
  points: number;
  codePromo: string | null;
  promotionId: string | null;
  promotionTitle: string | null;
  zoneId: string | null;

  // ========== NOTES ==========
  note: string | null;

  // ========== MÉTADONNÉES ==========
  auto: boolean;
}