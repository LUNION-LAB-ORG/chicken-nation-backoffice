
import {
  Order as IOrder,
  Paiement,
} from "../types/order.types";
import { Order } from "../types/ordersTable.types";

// Mapper le statut API vers le statut UI
export const mapApiStatusToUiStatus = (apiStatus: string): Order["status"] => {
  const statusMapping: Record<string, Order["status"]> = {
    PENDING: "NOUVELLE",
    ACCEPTED: "EN COURS",
    IN_PROGRESS: "EN PRÉPARATION",
    READY: "PRÊT",
    PICKED_UP: "LIVRAISON",
    DELIVERED: "LIVRÉ",
    COLLECTED: "COLLECTÉ",
    CANCELLED: "ANNULÉE",
    COMPLETED: "TERMINÉ",
  };
  return statusMapping[apiStatus] || "NOUVELLE";
};

// Mapper le type API vers le type UI
export const mapApiTypeToUiType = (apiType: string): Order["orderType"] => {
  const typeMapping: Record<string, Order["orderType"]> = {
    DELIVERY: "À livrer",
    PICKUP: "À récupérer",
    TABLE: "À table",
  };
  return typeMapping[apiType] || "À livrer";
};

// Extraire le nom du client
export const extractClientName = (apiOrder: IOrder): string => {
  if (apiOrder.customer?.first_name || apiOrder.customer?.last_name) {
    const firstName = apiOrder.customer.first_name || "";
    const lastName = apiOrder.customer.last_name || "";
    return `${firstName} ${lastName}`.trim();
  }
  if (apiOrder.fullname) {
    return apiOrder.fullname;
  }
  return "Client inconnu";
};

// Extraire et formater l'adresse
export const extractAddress = (addressString: string): string => {
  if (!addressString) return "Adresse non disponible";

  try {
    if (addressString.startsWith("{") || addressString.startsWith("[")) {
      const addressObj = JSON.parse(addressString);
      if (addressObj.formattedAddress) return addressObj.formattedAddress;

      const parts = [];
      if (addressObj.title) parts.push(addressObj.title);
      if (addressObj.address || addressObj.road)
        parts.push(addressObj.address || addressObj.road);
      if (addressObj.city) parts.push(addressObj.city);
      if (addressObj.postalCode) parts.push(addressObj.postalCode);

      return parts.join(", ") || "Adresse non disponible";
    }
    return addressString;
  } catch {
    return addressString || "Adresse non disponible";
  }
};

// Formater la date
export const formatDate = (dateString: string): string => {
  if (!dateString) return new Date().toLocaleDateString("fr-FR");

  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("fr-FR");
  } catch {
    return new Date().toLocaleDateString("fr-FR");
  }
};

// Extraire le mode de paiement
export const extractPaymentMethod = (paiements: Paiement[]): string => {
  if (!paiements || paiements.length === 0) return "Non renseigné";

  const firstPayment = paiements[0];
  if (firstPayment.mode) {
    const methodMapping: Record<string, string> = {
      MOBILE_MONEY: "Mobile Money",
      CASH: "Espèces",
      CARD: "Carte bancaire",
    };
    return methodMapping[firstPayment.mode] || firstPayment.mode;
  }

  return "Non renseigné";
};

// Valider et nettoyer les URLs d'images
export const validateImageUrl = (
  imageUrl: string | undefined | null
): string => {
  if (!imageUrl || typeof imageUrl !== "string" || imageUrl.trim() === "") {
    return "/images/food2.png";
  }

  const cleanUrl = imageUrl.trim();

  if (
    cleanUrl.startsWith("/") ||
    cleanUrl.startsWith("http://") ||
    cleanUrl.startsWith("https://")
  ) {
    return cleanUrl;
  }

  return "/images/food2.png";
};

// Extraire les items de commande
export const extractItems = (
  orderItems: IOrder["order_items"]
): Order["items"] => {
  if (!Array.isArray(orderItems)) return [];

  return orderItems.map((item) => ({
    id: item.id || "",
    name: item.dish?.name || "Article inconnu",
    quantity: item.quantity || 1,
    price: item.amount || item.dish?.price || 0,
    image: validateImageUrl(item.dish?.image),
    epice: item.epice,
    supplemens:
      item.supplements?.map((supplement) => supplement.name).join(", ") || "",
    supplementsPrice:
      item.supplements?.reduce(
        (total, supplement) => total + supplement.price,
        0
      ) || 0,
  }));
};

// Mapper une commande API complète vers une commande UI
export const mapApiOrderToUiOrder = (apiOrder: IOrder): Order => {
  return {
    // Identifiants
    id: apiOrder.id || "",
    reference: apiOrder.reference || "REF-INCONNUE",
    orderNumber: apiOrder.reference || "",

    // Informations client
    clientName: extractClientName(apiOrder),
    clientEmail: apiOrder.customer?.email || apiOrder.email || "",
    clientPhone: apiOrder.customer?.phone || apiOrder.phone || "",
    userId: apiOrder.customer_id || "",

    // Dates
    date: formatDate(apiOrder?.date!),
    createdAt: apiOrder.created_at || "",
    updatedAt: apiOrder.updated_at || "",

    // Statut et type
    status: mapApiStatusToUiStatus(apiOrder.status),
    statusDisplayText: mapApiStatusToUiStatus(apiOrder.status),
    orderType: mapApiTypeToUiType(apiOrder.type),

    // Prix
    totalPrice: apiOrder.amount || 0,
    deliveryPrice: apiOrder.delivery_fee || 0,
    subtotal: apiOrder.net_amount || apiOrder.amount || 0,
    tax: apiOrder.tax || 0,
    discount: apiOrder.discount || 0,

    // Localisation
    address: extractAddress(apiOrder?.address),
    tableNumber: "",
    tableType: apiOrder.table_type || "",
    numberOfGuests: apiOrder.places || 0,

    // Restaurant
    restaurant: apiOrder.restaurant?.name || "Restaurant inconnu",
    restaurantId: apiOrder.restaurant_id || "",

    // Items
    items: extractItems(apiOrder.order_items),

    // Paiement
    paymentMethod: extractPaymentMethod(apiOrder.paiements),
    paymentStatus: apiOrder.paied ? "PAID" : "PENDING",
    paiements: apiOrder.paiements || [],
    paied: apiOrder.paied,

    // Notes
    notes: apiOrder.note || "",
    specialInstructions: "",

    // Métadonnées
    source: "APP",
    platform: "WEB",
    estimatedDelivery: apiOrder.estimated_delivery_time || "",

    // État UI
    hidden: false,
    auto: apiOrder.auto,
  };
};