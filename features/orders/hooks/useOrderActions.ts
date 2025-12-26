import { getRawOrderById } from "@/services/orderService";
import { useDashboardStore } from "@/store/dashboardStore";
import { useCallback, useState } from "react";
import { useOrderUpdateStatusMutation } from "../queries/order-update-status.mutation";
import { Order, OrderStatus } from "../types/order.types";
import { OrderTable } from "../types/ordersTable.types";

export const useOrderActions = () => {
  const { setSelectedItem, setSectionView } = useDashboardStore();
  const [printingLoading, setPrintingLoading] = useState(false);

  // mutation pour mise à jour du statut de la commande
  const {
    mutateAsync: updateOrderStatus,
    isPending: isUpdateStatusLoading,
  } = useOrderUpdateStatusMutation();

  // fonction pour imprimer la commande
  const printOrder = useCallback((order: Order) => {
    if (
      typeof window !== "undefined" &&
      window.flutter_inappwebview?.callHandler
    ) {
      console.log("Printing order:", order);
      window.flutter_inappwebview.callHandler("printDocument", order);
    } else {
      console.warn("Printing non disponible");
    }
  }, []);

  // handle pour voir les détails de la commande
  const handleViewOrderDetails = useCallback(
    (order: OrderTable) => {
      setSelectedItem("orders", order);
      setSectionView("orders", "view");
    },
    [setSelectedItem, setSectionView]
  );

  // handle de mise à jour de statut de la commande
  const handleOrderUpdateStatus = useCallback(
    async (orderId: string, status: OrderStatus) => {
      try {
        const order = await updateOrderStatus({ id: orderId, status });

        if (status === OrderStatus.ACCEPTED) {
          printOrder(order);
        }
      } catch (error) {
        console.error("Erreur lors de la mise à jour du statut :", error);
      }
    },
    [updateOrderStatus, printOrder]
  );

  // handle pour imprimer la commande
  const handlePrintOrder = useCallback(
    async (orderId: string) => {
      try {
        setPrintingLoading(true);
        const order = await getRawOrderById(orderId);

        if (!order) {
          throw new Error("Commande introuvable");
        }

        printOrder(order);
        return true;
      } catch (error) {
        console.error("Erreur impression commande :", error);
        return false;
      } finally {
        setPrintingLoading(false);
      }
    },
    [printOrder]
  );

  return {
    handleViewOrderDetails,
    handleOrderUpdateStatus,
    handlePrintOrder,
    isLoading: isUpdateStatusLoading || printingLoading,
  };
};
