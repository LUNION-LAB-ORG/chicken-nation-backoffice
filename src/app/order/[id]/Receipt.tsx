import React from "react";
import { Document, Page, Text, View } from "@react-pdf/renderer";
import { OrderData } from "./types";
import {
  styles,
  validateOrderData,
  parseAddress,
  getPaymentModeLabel,
  getOrderTypeLabel,
  formatCurrency,
  formatDate,
  formatTime,
} from "./utils";

interface ReceiptPDFProps {
  order: OrderData;
}

export function receiptPDF({ order }: ReceiptPDFProps) {
  const validationErrors = validateOrderData(order);

  if (validationErrors.length > 0) {
    return (
      <Document>
        <Page size={[384, 1000]} style={styles.page}>
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
      <Page size={[384, 1000]} style={styles.page}>
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
