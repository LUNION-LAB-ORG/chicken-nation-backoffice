import { StyleSheet } from "@react-pdf/renderer";
import { OrderData, ParsedAddress, PaymentMode } from "./types";

export const styles = StyleSheet.create({
  page: {
    width: 384,
    flexDirection: "column",
    backgroundColor: "#FFFFFF",
    padding: 15,
    fontSize: 16, // Augmenté
    fontFamily: "Courier",
  },
  divider: {
    fontSize: 16, // Augmenté
    textAlign: "center",
    marginVertical: 12, // Augmenté
  },
  header: {
    textAlign: "center",
    marginBottom: 15, // Augmenté
  },
  restaurantName: {
    fontSize: 24, // Augmenté
    fontWeight: "bold",
    marginBottom: 8, // Augmenté
    textTransform: "uppercase",
  },
  restaurantInfo: {
    fontSize: 14, // Augmenté
    marginBottom: 4, // Augmenté
    color: "#000",
  },
  receiptTitle: {
    fontSize: 18, // Augmenté
    fontWeight: "bold",
    marginTop: 15, // Augmenté
  },
  infoSection: {
    marginBottom: 15, // Augmenté
    padding: 8, // Augmenté
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8, // Augmenté
  },
  infoLabel: {
    fontWeight: "bold",
    fontSize: 16, // Augmenté
    flex: 1,
  },
  infoValue: {
    fontSize: 16, // Augmenté
    fontWeight: "normal",
    flex: 2,
    textAlign: "right",
  },
  itemsSection: {
    marginBottom: 15, // Augmenté
  },
  itemsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingBottom: 8, // Augmenté
    marginBottom: 8, // Augmenté
  },
  itemsHeaderText: {
    fontSize: 16, // Augmenté
    fontWeight: "bold",
    textTransform: "uppercase",
  },
  itemRow: {
    marginBottom: 10, // Augmenté
    borderBottom: 1,
    borderBottomStyle: "dotted",
    borderBottomColor: "#000",
    paddingBottom: 10, // Augmenté
  },
  itemMainRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 5, // Augmenté
  },
  itemName: {
    flex: 2,
    fontSize: 16, // Augmenté
    fontWeight: "bold",
  },
  itemQuantity: {
    flex: 0.5,
    textAlign: "right",
    fontSize: 16, // Augmenté
  },
  itemPrice: {
    flex: 1.5,
    textAlign: "right",
    fontSize: 16, // Augmenté
    fontWeight: "bold",
  },
  itemDetails: {
    fontSize: 14, // Augmenté
    color: "#333",
    marginTop: 4, // Augmenté
    fontStyle: "italic",
  },
  supplementText: {
    fontSize: 14, // Augmenté
    color: "#555",
    marginTop: 4, // Augmenté
    paddingLeft: 10,
  },
  spicyIndicator: {
    fontSize: 14, // Augmenté
    color: "#000",
    fontWeight: "bold",
  },
  promotionIndicator: {
    fontSize: 14, // Augmenté
    color: "#000",
    fontWeight: "bold",
  },
  totalsSection: {
    marginTop: 15, // Augmenté
    paddingTop: 15, // Augmenté
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8, // Augmenté
  },
  totalLabel: {
    fontSize: 16, // Augmenté
  },
  totalValue: {
    fontSize: 16, // Augmenté
    fontWeight: "bold",
  },
  grandTotal: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 15, // Augmenté
    paddingTop: 15, // Augmenté
    borderTop: 2,
    borderTopStyle: "solid",
    borderTopColor: "#000",
  },
  grandTotalLabel: {
    fontSize: 18, // Augmenté
    fontWeight: "bold",
  },
  grandTotalValue: {
    fontSize: 18, // Augmenté
    fontWeight: "bold",
  },
  footer: {
    textAlign: "center",
    marginTop: 30, // Augmenté
    paddingTop: 15, // Augmenté
  },
  footerText: {
    fontSize: 14, // Augmenté
    marginBottom: 8, // Augmenté
  },
  poweredBy: {
    fontSize: 12, // Augmenté
    color: "#000",
  },
});

export const formatCurrency = (amount: number | string | undefined | null): string => {
  if (amount === null || amount === undefined || amount === "") {
    return "0F";
  }
  const numAmount = Number(amount);
  if (isNaN(numAmount)) {
    return "0F";
  }
  return `${numAmount.toLocaleString("fr-FR")}F`;
};

export const formatDate = (dateString: string | undefined | null): string => {
  if (!dateString) return new Date().toLocaleDateString("fr-FR");
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("fr-FR");
  } catch {
    return dateString;
  }
};

export const formatTime = (timeString: string | undefined | null): string => {
  if (!timeString)
    return new Date().toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  return timeString;
};

export const parseAddress = (
  addressJson: string | undefined | null
): ParsedAddress | null => {
  if (!addressJson || typeof addressJson !== "string") return null;
  try {
    const parsed = JSON.parse(addressJson);
    return parsed && typeof parsed === "object"
      ? (parsed as ParsedAddress)
      : null;
  } catch {
    return null;
  }
};

export const getOrderTypeLabel = (type: string | undefined): string => {
  const safeType = type || "DELIVERY";
  switch (safeType) {
    case "DELIVERY":
      return "Livraison";
    case "PICKUP":
      return "À emporter";
    case "TABLE":
      return "Sur place";
    default:
      return safeType;
  }
};

export const getPaymentModeLabel = (mode: PaymentMode | undefined): string => {
  if (!mode) return "Non spécifié";
  switch (mode) {
    case "MOBILE_MONEY":
      return "Mobile Money";
    case "WALLET":
      return "Wallet";
    case "CREDIT_CARD":
      return "Carte bancaire";
    case "CASH":
      return "Espèces";
    default:
      return mode;
  }
};

export const validateOrderData = (order: OrderData): string[] => {
  const errors: string[] = [];
  if (!order) {
    errors.push("Données de commande manquantes");
    return errors;
  }
  if (!order.restaurant || !order.restaurant.name) {
    errors.push("Nom du restaurant manquant");
  }
  if (
    !order.order_items ||
    !Array.isArray(order.order_items) ||
    order.order_items.length === 0
  ) {
    errors.push("Articles de commande manquants");
  }
  return errors;
};
