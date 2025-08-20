import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { OrderData, ParsedAddress, PaymentMode } from "./types";

const styles = StyleSheet.create({
  page: {
    flexDirection: "column",
    backgroundColor: "#FFFFFF",
    padding: 30,
    fontSize: 11,
    fontFamily: "Courier",
    lineHeight: 1.4,
  },
  header: {
    textAlign: "center",
    marginBottom: 25,
    borderBottom: 1,
    borderBottomStyle: "dashed",
    paddingBottom: 15,
  },
  restaurantName: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 5,
    textTransform: "uppercase",
  },
  restaurantInfo: {
    fontSize: 10,
    marginBottom: 2,
    color: "#666",
  },
  receiptTitle: {
    fontSize: 14,
    fontWeight: "bold",
    marginTop: 10,
  },
  orderInfo: {
    marginBottom: 20,
    backgroundColor: "#f8f9fa",
    padding: 15,
    borderRadius: 5,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 5,
    alignItems: "center",
  },
  infoLabel: {
    fontWeight: "bold",
    fontSize: 10,
    textTransform: "uppercase",
    color: "#666",
    flex: 1,
  },
  infoValue: {
    fontSize: 11,
    fontWeight: "bold",
    flex: 2,
    textAlign: "right",
  },
  itemsSection: {
    marginBottom: 20,
  },
  itemsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingBottom: 10,
    marginBottom: 10,
    borderBottom: 1,
    borderBottomStyle: "solid",
    borderBottomColor: "#ddd",
  },
  itemsHeaderText: {
    fontSize: 10,
    fontWeight: "bold",
    textTransform: "uppercase",
    color: "#666",
  },
  itemRow: {
    marginBottom: 12,
    paddingVertical: 8,
    borderBottom: 1,
    borderBottomStyle: "dotted",
    borderBottomColor: "#eee",
  },
  itemMainRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 3,
  },
  itemName: {
    flex: 2,
    fontSize: 11,
    fontWeight: "bold",
  },
  itemQuantity: {
    flex: 1,
    textAlign: "center",
    fontSize: 11,
  },
  itemPrice: {
    flex: 1,
    textAlign: "right",
    fontSize: 11,
    fontWeight: "bold",
  },
  itemDetails: {
    fontSize: 9,
    color: "#666",
    marginTop: 2,
    fontStyle: "italic",
  },
  supplementRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 2,
    paddingLeft: 10,
  },
  supplementText: {
    fontSize: 9,
    color: "#888",
  },
  spicyIndicator: {
    fontSize: 9,
    color: "#ff6b35",
    fontWeight: "bold",
  },
  promotionIndicator: {
    fontSize: 9,
    color: "#28a745",
    fontWeight: "bold",
  },
  totalsSection: {
    borderTop: 1,
    borderTopStyle: "dashed",
    paddingTop: 15,
    marginTop: 10,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 5,
  },
  totalLabel: {
    fontSize: 11,
  },
  totalValue: {
    fontSize: 11,
    fontWeight: "bold",
  },
  grandTotal: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
    paddingTop: 10,
    borderTop: 2,
    borderTopStyle: "solid",
  },
  grandTotalLabel: {
    fontSize: 14,
    fontWeight: "bold",
  },
  grandTotalValue: {
    fontSize: 14,
    fontWeight: "bold",
  },
  paymentSection: {
    marginTop: 15,
    padding: 10,
    backgroundColor: "#f0f8ff",
    borderRadius: 5,
  },
  paymentTitle: {
    fontSize: 11,
    fontWeight: "bold",
    marginBottom: 5,
    textAlign: "center",
  },
  paymentRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 3,
  },
  footer: {
    textAlign: "center",
    marginTop: 30,
    paddingTop: 20,
    borderTop: 1,
    borderTopStyle: "dashed",
  },
  footerText: {
    fontSize: 10,
    marginBottom: 5,
    color: "#666",
  },
  poweredBy: {
    fontSize: 8,
    color: "#999",
    marginTop: 10,
  },
  statusBadge: {
    padding: 3,
    borderRadius: 3,
    fontSize: 9,
    fontWeight: "bold",
    textTransform: "uppercase",
  },
  statusCompleted: {
    backgroundColor: "#d4edda",
    color: "#155724",
  },
  statusPending: {
    backgroundColor: "#fff3cd",
    color: "#856404",
  },
  statusCancelled: {
    backgroundColor: "#f8d7da",
    color: "#721c24",
  },
  statusConfirmed: {
    backgroundColor: "#cce5ff",
    color: "#004085",
  },
  statusPreparing: {
    backgroundColor: "#ffe4b3",
    color: "#664d00",
  },
  statusReady: {
    backgroundColor: "#d1ecf1",
    color: "#0c5460",
  },
  statusDelivering: {
    backgroundColor: "#e2e3e5",
    color: "#383d41",
  },
  errorSection: {
    backgroundColor: "#f8d7da",
    color: "#721c24",
    padding: 15,
    borderRadius: 5,
    textAlign: "center",
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
  if (!dateString) {
    return new Date().toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return dateString;
    }
    return date.toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return dateString;
  }
};

const formatTime = (timeString: string | undefined | null): string => {
  if (!timeString) {
    return new Date().toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }
  return timeString;
};

const parseAddress = (
  addressJson: string | undefined | null
): ParsedAddress | null => {
  if (!addressJson || typeof addressJson !== "string") {
    return null;
  }

  try {
    const parsed = JSON.parse(addressJson);
    return parsed && typeof parsed === "object"
      ? (parsed as ParsedAddress)
      : null;
  } catch {
    return null;
  }
};

const getStatusStyle = (status: string | undefined) => {
  const safeStatus = status || "PENDING";
  switch (safeStatus) {
    case "COMPLETED":
      return [styles.statusBadge, styles.statusCompleted];
    case "CONFIRMED":
      return [styles.statusBadge, styles.statusConfirmed];
    case "PREPARING":
      return [styles.statusBadge, styles.statusPreparing];
    case "READY":
      return [styles.statusBadge, styles.statusReady];
    case "DELIVERING":
      return [styles.statusBadge, styles.statusDelivering];
    case "CANCELLED":
      return [styles.statusBadge, styles.statusCancelled];
    case "PENDING":
    default:
      return [styles.statusBadge, styles.statusPending];
  }
};

const getStatusLabel = (status: string | undefined): string => {
  const safeStatus = status || "PENDING";
  switch (safeStatus) {
    case "PENDING":
      return "En attente";
    case "CONFIRMED":
      return "Confirmée";
    case "PREPARING":
      return "En préparation";
    case "READY":
      return "Prête";
    case "DELIVERING":
      return "En livraison";
    case "COMPLETED":
      return "Terminée";
    case "CANCELLED":
      return "Annulée";
    default:
      return safeStatus;
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

  if (!order.restaurant) {
    errors.push("Données du restaurant manquantes");
  } else {
    if (!order.restaurant.name) {
      errors.push("Nom du restaurant manquant");
    }
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
        <Page size="A4" style={styles.page}>
          <View style={styles.errorSection}>
            <Text
              style={{ fontSize: 16, fontWeight: "bold", marginBottom: 10 }}
            >
              Erreur dans les données de la commande
            </Text>
            {validationErrors.map((error, index) => (
              <Text key={index} style={{ marginBottom: 5 }}>
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
      <Page size="A4" style={styles.page}>
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

        {/* Order Info */}
        <View style={styles.orderInfo}>
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
          {deliveryAddress && safeOrder.type === "DELIVERY" && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Adresse</Text>
              <Text style={styles.infoValue}>
                {deliveryAddress.address || "Adresse non spécifiée"},{" "}
                {deliveryAddress.city || ""}
              </Text>
            </View>
          )}
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Statut</Text>
            <Text style={getStatusStyle(safeOrder.status)}>
              {getStatusLabel(safeOrder.status)}
            </Text>
          </View>
          {safeOrder.estimated_delivery_time && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Livraison estimée</Text>
              <Text style={styles.infoValue}>
                {safeOrder.estimated_delivery_time}
              </Text>
            </View>
          )}
        </View>

        {/* Items */}
        <View style={styles.itemsSection}>
          <View style={styles.itemsHeader}>
            <Text style={[styles.itemsHeaderText, { flex: 2 }]}>Articles</Text>
            <Text
              style={[styles.itemsHeaderText, { flex: 1, textAlign: "center" }]}
            >
              Qté
            </Text>
            <Text
              style={[styles.itemsHeaderText, { flex: 1, textAlign: "right" }]}
            >
              Prix
            </Text>
          </View>

          {order.order_items && Array.isArray(order.order_items) ? (
            order.order_items.map((item, index) => {
              if (!item || !item.dish) {
                return (
                  <View key={index} style={styles.itemRow}>
                    <Text style={styles.itemName}>Article invalide</Text>
                  </View>
                );
              }

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
                    <Text style={[styles.itemQuantity, { flex: 1 }]}>
                      ×{item.quantity || 1}
                    </Text>
                    <Text style={[styles.itemPrice, { flex: 1 }]}>
                      {formatCurrency(item.amount)}
                    </Text>
                  </View>

                  {/* Supplements */}
                  {item.supplements &&
                    Array.isArray(item.supplements) &&
                    item.supplements.length > 0 && (
                      <View style={{ marginTop: 5 }}>
                        {item.supplements.map((supplement, suppIndex) => {
                          if (!supplement) return null;

                          return (
                            <View key={suppIndex} style={styles.supplementRow}>
                              <Text
                                style={[styles.supplementText, { flex: 2 }]}
                              >
                                + {supplement.name || "Supplément"}
                              </Text>
                              <Text
                                style={[
                                  styles.supplementText,
                                  { flex: 1, textAlign: "right" },
                                ]}
                              >
                                {formatCurrency(supplement.price)}
                              </Text>
                            </View>
                          );
                        })}
                      </View>
                    )}
                </View>
              );
            })
          ) : (
            <View style={styles.itemRow}>
              <Text style={styles.itemName}>Aucun article trouvé</Text>
            </View>
          )}
        </View>

        {/* Totals */}
        <View style={styles.totalsSection}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Montant net:</Text>
            <Text style={styles.totalValue}>
              {formatCurrency(safeOrder.net_amount)}
            </Text>
          </View>

          {Number(safeOrder.discount) > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Remise:</Text>
              <Text style={styles.totalValue}>
                -{formatCurrency(safeOrder.discount)}
              </Text>
            </View>
          )}

          {Number(safeOrder.delivery_fee) > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Frais de livraison:</Text>
              <Text style={styles.totalValue}>
                {formatCurrency(safeOrder.delivery_fee)}
              </Text>
            </View>
          )}

          {Number(safeOrder.tax) > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Taxe:</Text>
              <Text style={styles.totalValue}>
                {formatCurrency(safeOrder.tax)}
              </Text>
            </View>
          )}

          <View style={styles.grandTotal}>
            <Text style={styles.grandTotalLabel}>TOTAL:</Text>
            <Text style={styles.grandTotalValue}>
              {formatCurrency(safeOrder.amount)}
            </Text>
          </View>
        </View>

        {/* Payment Info */}
        {successfulPayment && (
          <View style={styles.paymentSection}>
            <Text style={styles.paymentTitle}>INFORMATIONS DE PAIEMENT</Text>
            <View style={styles.paymentRow}>
              <Text>Mode de paiement:</Text>
              <Text>{getPaymentModeLabel(successfulPayment.mode)}</Text>
            </View>
            <View style={styles.paymentRow}>
              <Text>Référence:</Text>
              <Text>{successfulPayment.reference || "N/A"}</Text>
            </View>
            <View style={styles.paymentRow}>
              <Text>Montant payé:</Text>
              <Text>{formatCurrency(successfulPayment.amount)}</Text>
            </View>
            {Number(successfulPayment.fees) > 0 && (
              <View style={styles.paymentRow}>
                <Text>Frais:</Text>
                <Text>{formatCurrency(successfulPayment.fees)}</Text>
              </View>
            )}
            <View style={styles.paymentRow}>
              <Text>Statut:</Text>
              <Text style={{ color: "#28a745", fontWeight: "bold" }}>
                Payé ✓
              </Text>
            </View>
          </View>
        )}

        {/* Notes */}
        {safeOrder.note && (
          <View
            style={{ marginTop: 20, padding: 10, backgroundColor: "#f8f9fa" }}
          >
            <Text style={{ fontSize: 10, fontWeight: "bold", marginBottom: 5 }}>
              Notes:
            </Text>
            <Text style={{ fontSize: 10 }}>{safeOrder.note}</Text>
          </View>
        )}

        {/* Points earned */}
        {Number(safeOrder.points) > 0 && (
          <View
            style={{
              marginTop: 15,
              padding: 10,
              backgroundColor: "#fff3cd",
              textAlign: "center",
            }}
          >
            <Text
              style={{ fontSize: 10, fontWeight: "bold", color: "#856404" }}
            >
              🎉 Vous avez gagné {safeOrder.points} points avec cette commande!
            </Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Merci pour votre commande!</Text>
          <Text style={styles.footerText}>
            Nous espérons vous revoir bientôt.
          </Text>
          {safeOrder.code_promo && (
            <Text style={styles.footerText}>
              Code promo utilisé: {safeOrder.code_promo}
            </Text>
          )}
          <Text style={styles.poweredBy}>Powered by LUnion TPE</Text>
        </View>
      </Page>
    </Document>
  );
}
