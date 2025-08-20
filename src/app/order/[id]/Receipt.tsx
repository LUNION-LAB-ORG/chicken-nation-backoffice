import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { OrderData, ParsedAddress, PaymentMode } from "./types";

// Les styles sont la partie la plus importante à corriger
const styles = StyleSheet.create({
  page: {
    width: 384,
    flexDirection: "column",
    backgroundColor: "#FFFFFF",
    padding: 15,
    fontSize: 14, // Augmenté
    fontFamily: "Courier",
  },
  divider: {
    fontSize: 14, // Augmenté
    textAlign: "center",
    marginVertical: 10,
  },
  header: {
    textAlign: "center",
    marginBottom: 10,
  },
  restaurantName: {
    fontSize: 22, // Augmenté
    fontWeight: "bold",
    marginBottom: 5,
    textTransform: "uppercase",
  },
  restaurantInfo: {
    fontSize: 12, // Augmenté
    marginBottom: 2,
    color: "#000",
  },
  receiptTitle: {
    fontSize: 16, // Augmenté
    fontWeight: "bold",
    marginTop: 10,
  },
  infoSection: {
    marginBottom: 10,
    padding: 5,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 5,
  },
  infoLabel: {
    fontWeight: "bold",
    fontSize: 14, // Augmenté
    flex: 1,
  },
  infoValue: {
    fontSize: 14, // Augmenté
    fontWeight: "normal",
    flex: 2,
    textAlign: "right",
  },
  itemsSection: {
    marginBottom: 10,
  },
  itemsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingBottom: 5,
    marginBottom: 5,
  },
  itemsHeaderText: {
    fontSize: 14, // Augmenté
    fontWeight: "bold",
    textTransform: "uppercase",
  },
  itemRow: {
    marginBottom: 8,
    borderBottom: 1,
    borderBottomStyle: "dotted",
    borderBottomColor: "#000",
    paddingBottom: 8,
  },
  itemMainRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 3,
  },
  itemName: {
    flex: 2,
    fontSize: 14, // Augmenté
    fontWeight: "bold",
  },
  itemQuantity: {
    flex: 0.5,
    textAlign: "right",
    fontSize: 14, // Augmenté
  },
  itemPrice: {
    flex: 1.5,
    textAlign: "right",
    fontSize: 14, // Augmenté
    fontWeight: "bold",
  },
  itemDetails: {
    fontSize: 12, // Augmenté
    color: "#333",
    marginTop: 2,
    fontStyle: "italic",
  },
  supplementText: {
    fontSize: 12, // Augmenté
    color: "#555",
    marginTop: 2,
    paddingLeft: 10,
  },
  spicyIndicator: {
    fontSize: 12, // Augmenté
    color: "#000",
    fontWeight: "bold",
  },
  promotionIndicator: {
    fontSize: 12, // Augmenté
    color: "#000",
    fontWeight: "bold",
  },
  totalsSection: {
    marginTop: 10,
    paddingTop: 10,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 5,
  },
  totalLabel: {
    fontSize: 14, // Augmenté
  },
  totalValue: {
    fontSize: 14, // Augmenté
    fontWeight: "bold",
  },
  grandTotal: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
    paddingTop: 10,
    borderTop: 2,
    borderTopStyle: "solid",
    borderTopColor: "#000",
  },
  grandTotalLabel: {
    fontSize: 16, // Augmenté
    fontWeight: "bold",
  },
  grandTotalValue: {
    fontSize: 16, // Augmenté
    fontWeight: "bold",
  },
  footer: {
    textAlign: "center",
    marginTop: 20,
    paddingTop: 10,
  },
  footerText: {
    fontSize: 12, // Augmenté
    marginBottom: 5,
  },
  poweredBy: {
    fontSize: 10, // Augmenté
    color: "#000",
  },
});

interface ReceiptPDFProps {
  order: OrderData;
}

const formatCurrency = (amount: number | string | undefined | null): string => {
  if (amount === null || amount === undefined || amount === "") {
    return "0F";
  }
  const numAmount = Number(amount);
  if (isNaN(numAmount)) {
    return "0F";
  }
  return `${numAmount.toLocaleString("fr-FR")}F`;
};

const formatDate = (dateString: string | undefined | null): string => {
  if (!dateString) return new Date().toLocaleDateString("fr-FR");
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("fr-FR");
  } catch {
    return dateString;
  }
};

const formatTime = (timeString: string | undefined | null): string => {
  if (!timeString)
    return new Date().toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  return timeString;
};

const parseAddress = (
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

const getOrderTypeLabel = (type: string | undefined): string => {
  const safeType = type || "DELIVERY";
  switch (safeType) {
    case "DELIVERY":
      return "Livraison";
    case "TAKEAWAY":
      return "À emporter";
    case "DINE_IN":
      return "Sur place";
    default:
      return safeType;
  }
};

const getPaymentModeLabel = (mode: PaymentMode | undefined): string => {
  if (!mode) return "Non spécifié";
  switch (mode) {
    case "MOBILE_MONEY":
      return "Mobile Money";
    case "CARD":
      return "Carte bancaire";
    case "CASH":
      return "Espèces";
    case "BANK_TRANSFER":
      return "Virement bancaire";
    default:
      return mode;
  }
};

const validateOrderData = (order: OrderData): string[] => {
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

export function receiptPDF({ order }: ReceiptPDFProps) {
  const validationErrors = validateOrderData(order);

  if (validationErrors.length > 0) {
    return (
      <Document>
        <Page size={[384, 1500]} style={styles.page}>
          <View>
            <Text style={{ fontSize: 16, fontWeight: "bold" }}>
              Erreur dans les données
            </Text>
            {validationErrors.map((error, index) => (
              <Text key={index} style={{ fontSize: 14 }}>
                • {error}
              </Text>
            ))}
          </View>
        </Page>
      </Document>
    );
  }

  const safeOrder = {
    ...order,
    reference: order.reference || "N/A",
    date: order.date || new Date().toISOString().split("T")[0],
    time: order.time || new Date().toLocaleTimeString("fr-FR"),
    phone: order.phone || "N/A",
    type: order.type || "DELIVERY",
    status: order.status || "PENDING",
    net_amount: order.net_amount ?? 0,
    amount: order.amount ?? 0,
    discount: order.discount ?? 0,
    delivery_fee: order.delivery_fee ?? 0,
    tax: order.tax ?? 0,
    points: order.points ?? 0,
    note: order.note || "",
    code_promo: order.code_promo || "",
    address: order.address || "",
    estimated_delivery_time: order.estimated_delivery_time || "",
  };

  const deliveryAddress = safeOrder.address
    ? parseAddress(safeOrder.address)
    : null;
  const successfulPayment = order.paiements?.find(
    (p) => p && p.status === "SUCCESS"
  );
  const customerName = order.customer
    ? `${order.customer.first_name || ""} ${
        order.customer.last_name || ""
      }`.trim() || "Client"
    : "Client";

  return (
    <Document>
      <Page size={[384, 1500]} style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.restaurantName}>
            {order.restaurant?.name || "Restaurant"}
          </Text>
          <Text style={styles.restaurantInfo}>
            {order.restaurant?.address || "Adresse non spécifiée"}
          </Text>
          {order.restaurant?.phone && (
            <Text style={styles.restaurantInfo}>
              Tél: {order.restaurant.phone}
            </Text>
          )}
          {order.restaurant?.email && (
            <Text style={styles.restaurantInfo}>
              Email: {order.restaurant.email}
            </Text>
          )}
          <Text style={styles.receiptTitle}>REÇU DE COMMANDE</Text>
        </View>

        <Text style={styles.divider}>--------------------------------</Text>

        {/* Order Info */}
        <View style={styles.infoSection}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Commande</Text>
            <Text style={styles.infoValue}>#{safeOrder.reference}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Date</Text>
            <Text style={styles.infoValue}>
              {formatDate(safeOrder.date)} à {formatTime(safeOrder.time)}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Client</Text>
            <Text style={styles.infoValue}>{customerName}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Téléphone</Text>
            <Text style={styles.infoValue}>{safeOrder.phone}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Type</Text>
            <Text style={styles.infoValue}>
              {getOrderTypeLabel(safeOrder.type)}
            </Text>
          </View>
          {safeOrder.type === "DELIVERY" && deliveryAddress && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Adresse</Text>
              <Text style={styles.infoValue}>
                {deliveryAddress.address || "Adresse non spécifiée"}
              </Text>
            </View>
          )}
        </View>

        <Text style={styles.divider}>--------------------------------</Text>

        {/* Items */}
        <View style={styles.itemsSection}>
          <View style={styles.itemsHeader}>
            <Text style={[styles.itemsHeaderText, { flex: 2 }]}>Articles</Text>
            <Text
              style={[
                styles.itemsHeaderText,
                { flex: 0.5, textAlign: "right" },
              ]}
            >
              Qté
            </Text>
            <Text
              style={[
                styles.itemsHeaderText,
                { flex: 1.5, textAlign: "right" },
              ]}
            >
              Prix
            </Text>
          </View>
          {order.order_items && Array.isArray(order.order_items) ? (
            order.order_items.map((item, index) => {
              if (!item || !item.dish) return null;
              return (
                <View key={index} style={styles.itemRow}>
                  <View style={styles.itemMainRow}>
                    <View style={{ flex: 2 }}>
                      <Text style={styles.itemName}>
                        {item.dish.name || "Plat sans nom"}
                      </Text>
                      {item.dish.description && (
                        <Text style={styles.itemDetails}>
                          {item.dish.description}
                        </Text>
                      )}
                      {item.epice && (
                        <Text style={styles.spicyIndicator}>🌶️ Épicé</Text>
                      )}
                      {item.dish.is_promotion && (
                        <Text style={styles.promotionIndicator}>
                          🏷️ Promotion
                        </Text>
                      )}
                    </View>
                    <Text style={styles.itemQuantity}>
                      ×{item.quantity || 1}
                    </Text>
                    <Text style={styles.itemPrice}>
                      {formatCurrency(item.amount)}
                    </Text>
                  </View>
                  {item.supplements &&
                    Array.isArray(item.supplements) &&
                    item.supplements.length > 0 && (
                      <View style={{ marginTop: 5 }}>
                        {item.supplements.map((supplement, suppIndex) => (
                          <Text key={suppIndex} style={styles.supplementText}>
                            + {supplement.name || "Supplément"}
                          </Text>
                        ))}
                      </View>
                    )}
                </View>
              );
            })
          ) : (
            <Text style={{ fontSize: 14 }}>Aucun article trouvé</Text>
          )}
        </View>

        <Text style={styles.divider}>--------------------------------</Text>

        {/* Totals */}
        <View style={styles.totalsSection}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>TOTAL:</Text>
            <Text style={styles.totalValue}>
              {formatCurrency(safeOrder.amount)}
            </Text>
          </View>
        </View>

        {/* Payment Info */}
        {successfulPayment && (
          <View style={styles.infoSection}>
            <Text style={styles.infoLabel}>Paiement</Text>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Mode:</Text>
              <Text style={styles.totalValue}>
                {getPaymentModeLabel(successfulPayment.mode)}
              </Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Statut:</Text>
              <Text style={styles.totalValue}>Payé</Text>
            </View>
          </View>
        )}

        {/* Notes */}
        {safeOrder.note && (
          <View style={{ marginTop: 15 }}>
            <Text style={{ fontSize: 14, fontWeight: "bold" }}>Notes:</Text>
            <Text style={{ fontSize: 14 }}>{safeOrder.note}</Text>
          </View>
        )}

        <Text style={styles.divider}>--------------------------------</Text>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Merci pour votre commande!</Text>
          <Text style={styles.poweredBy}>Powered by LUnion TPE</Text>
        </View>
      </Page>
    </Document>
  );
}
