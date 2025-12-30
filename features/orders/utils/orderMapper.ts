import { Order, OrderStatus, OrderType } from "../types/order.types";
import { OrderTable, OrderTableItem, OrderTableStatus, OrderTableType, PaymentStatus } from "../types/ordersTable.types";
import { Paiement } from "../types/paiement.types";


// ========================================
// CONSTANTES DE MAPPING
// ========================================

const STATUS_MAP: Record<OrderStatus, OrderTableStatus> = {
  [OrderStatus.PENDING]: "NOUVELLE",
  [OrderStatus.ACCEPTED]: "EN COURS",
  [OrderStatus.IN_PROGRESS]: "EN PRÉPARATION",
  [OrderStatus.READY]: "PRÊT",
  [OrderStatus.PICKED_UP]: "LIVRAISON",
  [OrderStatus.COLLECTED]: "COLLECTÉ",
  [OrderStatus.CANCELLED]: "ANNULÉE",
  [OrderStatus.COMPLETED]: "TERMINÉ",
};

const TYPE_MAP: Record<OrderType, OrderTableType> = {
  [OrderType.DELIVERY]: "À livrer",
  [OrderType.PICKUP]: "À récupérer",
  [OrderType.TABLE]: "À table",
};

const PAYMENT_METHOD_MAP: Record<string, string> = {
  MOBILE_MONEY: "Mobile Money",
  CASH: "Espèces",
  CARD: "Carte bancaire",
  WALLET: "Portefeuille",
};

const DELIVERY_SERVICE_MAP: Record<string, string> = {
  TURBO: "Livraison Turbo",
  FREE: "Livraison Standard",
};

const DEFAULT_IMAGE = "/images/food2.png";

// ========================================
// FONCTIONS UTILITAIRES
// ========================================

const extractClientName = (order: Order): string => {
  const { customer, fullname } = order;

  if (customer?.first_name || customer?.last_name) {
    return `${customer.first_name || ""} ${customer.last_name || ""}`.trim();
  }

  return fullname || "Client inconnu";
};

const extractAddress = (addressString: string | null): string => {
  if (!addressString) return "Adresse non disponible";

  try {
    const parsed = JSON.parse(addressString);

    // Si formattedAddress existe, l'utiliser directement
    if (parsed.formattedAddress) return parsed.formattedAddress;

    // Sinon construire l'adresse
    const parts = [
      parsed.title,
      parsed.address || parsed.road,
      parsed.city,
      parsed.postalCode
    ].filter(Boolean);

    return parts.length > 0 ? parts.join(", ") : "Adresse non disponible";
  } catch {
    return addressString;
  }
};

const extractPaymentMethod = (paiements?: Paiement[]): string => {
  if (!paiements?.length) return "";

  const modes = paiements.map((p) => PAYMENT_METHOD_MAP[p.mode] || p.mode).join(", ");

  return modes;
};

const extractPaymentSource = (paiements?: Paiement[]): string => {
  if (!paiements?.length) return "";

  const sources = paiements.map((p) => p.source.toUpperCase() || "");

  return sources.length > 1 ? sources.join(", ") : sources[0];
};

const extractPaymentMode = (paiements?: Paiement[]): string => {
  if (!paiements?.length) return "Non renseigné";

  const methode = extractPaymentMethod(paiements);
  const source = extractPaymentSource(paiements);
  return methode + " : " + source;
};

const validateImageUrl = (url?: string | null): string => {
  if (!url?.trim()) return DEFAULT_IMAGE;

  const cleanUrl = url.trim();
  if (cleanUrl.startsWith("/") || cleanUrl.startsWith("http")) {
    return cleanUrl;
  }

  return DEFAULT_IMAGE;
};

export const getPaymentStatus = (order: Order): PaymentStatus => {
  if (
    order.status === OrderStatus.CANCELLED &&
    order.paiements &&
    order.paiements.length > 0
  ) {
    const hasRevertedPayment = order.paiements?.some(
      (p) => p.status === "REVERTED"
    );
    return hasRevertedPayment ? "REFUNDED" : "TO_REFUND";
  }
  if (order.paied == false) {
    return "UNPAID";
  }
  return "PAID";
};

const formatDate = (dateString: string | null): string => {
  if (!dateString) return new Date().toLocaleDateString("fr-FR");

  try {
    return new Date(dateString).toLocaleDateString("fr-FR");
  } catch {
    return new Date().toLocaleDateString("fr-FR");
  }
};

const mapOrderItems = (orderItems?: Order["order_items"]): OrderTableItem[] => {
  if (!orderItems?.length) return [];

  return orderItems.map((item) => {
    const supplementNames = item.supplements?.map(s => s.name).join(", ") || "";
    const supplementsPrice = item.supplements?.reduce((sum, s) => sum + s.price, 0) || 0;

    return {
      id: item.id,
      name: item.dish?.name || "Article inconnu",
      quantity: item.quantity,
      price: item.amount,
      image: validateImageUrl(item.dish?.image),
      epice: item.epice,
      supplements: supplementNames,
      supplementsPrice,
    };
  });
};

// ========================================
// FONCTION DE MAPPING PRINCIPALE
// ========================================

export const mapApiOrderToUiOrder = (order: Order): OrderTable => {
  return {
    // Identifiants
    id: order.id,
    reference: order.reference || "Référence non disponible",

    // Client
    clientName: extractClientName(order),
    clientEmail: order.customer?.email || order.email || "",
    clientPhone: order.customer?.phone || order.phone || "",
    customerId: order.customer_id,

    // Dates
    date: formatDate(order.date),
    createdAt: order.created_at,
    updatedAt: order.updated_at,
    completedAt: order.completed_at,
    paiedAt: order.paied_at,

    // Statut
    status: STATUS_MAP[order.status],
    orderType: TYPE_MAP[order.type],

    // Montants
    amount: order.amount,
    netAmount: order.net_amount,
    deliveryFee: order.delivery_fee,
    tax: order.tax,
    discount: order.discount,

    // Livraison/Table
    address: extractAddress(order.address),
    deliveryService: DELIVERY_SERVICE_MAP[order.delivery_service] || order.delivery_service,
    estimatedDeliveryTime: order.estimated_delivery_time,
    estimatedPreparationTime: order.estimated_preparation_time,
    tableType: order.table_type,
    places: order.places,

    // Restaurant
    restaurantId: order.restaurant_id,
    restaurantName: order.restaurant?.name || "Restaurant inconnu",

    // Items
    items: mapOrderItems(order.order_items),

    // Paiement
    paied: order.paied,
    paymentStatus: getPaymentStatus(order),
    paymentMethod: extractPaymentMethod(order.paiements),
    paymentSource: extractPaymentSource(order.paiements),
    paymentMode: extractPaymentMode(order.paiements),
    paiements: order.paiements || [],

    // Bonus/Promo
    points: order.points,
    codePromo: order.code_promo,
    promotionId: order.promotion_id,
    zoneId: order.zone_id,

    // Notes
    note: order.note,

    // Métadonnées
    auto: order.auto,
  };
};

// ========================================
// FONCTIONS D'EXPORT SUPPLÉMENTAIRES
// ========================================

// Pour mapper plusieurs commandes
export const mapApiOrdersToUiOrders = (orders: Order[]): OrderTable[] => {
  return orders.map(mapApiOrderToUiOrder);
};

// Pour vérifier si une commande peut être modifiée
export const canEditOrder = (status: OrderStatus): boolean => {
  return ![
    OrderStatus.CANCELLED,
    OrderStatus.COMPLETED,
    OrderStatus.COLLECTED
  ].includes(status);
};

// Pour vérifier si une commande peut être annulée
export const canCancelOrder = (status: OrderStatus): boolean => {
  return [
    OrderStatus.PENDING,
    OrderStatus.ACCEPTED
  ].includes(status);
};