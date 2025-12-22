import { PaymentStatus } from "@/components/gestion/Orders/PaymentBadge";
import { Order } from "../types/ordersTable.types";

/**
 * Détermine le statut de paiement d'une commande
 * @param order - La commande à analyser
 * @returns Le statut de paiement
 */
export const getPaymentStatus = (order: Order): PaymentStatus => {
  // Si la commande est annulée, vérifier le statut du paiement
  if (
    order.status === "ANNULÉE" &&
    order.paiements &&
    order.paiements.length > 0
  ) {
    // Vérifier s'il y a un paiement avec le statut REVERTED
    const hasRevertedPayment = order.paiements?.some(
      (p) => p.status === "REVERTED"
    );
    return hasRevertedPayment ? "REFUNDED" : "TO_REFUND";
  }

  // Si la commande n'est pas payée
  if (order.paied === false) {
    return "UNPAID";
  }

  // Pour toutes les autres commandes, elles sont considérées comme payées
  return "PAID";
};