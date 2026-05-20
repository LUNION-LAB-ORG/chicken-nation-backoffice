import { useDashboardStore } from "@/store/dashboardStore";
import { useCallback, useState } from "react";
import { toast } from "react-hot-toast";
import { useOrderUpdateStatusMutation } from "../queries/order-update-status.mutation";
import { Order, OrderStatus } from "../types/order.types";
import { OrderTable } from "../types/ordersTable.types";
import { getOrderById } from "../services/order-service";
import { imprimerTicket } from "../utils/imprimer-ticket";

export const useOrderActions = () => {
  const { setSelectedItem, setSectionView, toggleModal } = useDashboardStore();
  const [printingLoading, setPrintingLoading] = useState(false);

  // mutation pour mise à jour du statut de la commande
  const {
    mutateAsync: updateOrderStatus,
    isPending: isUpdateStatusLoading,
  } = useOrderUpdateStatusMutation();

  /**
   * Imprime un ticket de commande.
   *
   * Cascade automatique : WebUSB (imprimante thermique appairée) →
   * WebBluetooth → Flutter inAppWebView (TPE) → popup HTML.
   *
   * L'existant Flutter est CONSERVÉ : si le BO tourne dans l'app native CN,
   * le handler `printDocument` reste fonctionnel (priorité 3 dans la cascade,
   * derrière USB/BT mais devant le fallback HTML).
   */
  const printOrder = useCallback(async (order: Order) => {
    try {
      const result = await imprimerTicket(
        order,
        {
          nom: order.restaurant?.name ?? "Chicken Nation",
          adresse: order.restaurant?.address ?? undefined,
          telephone: order.restaurant?.phone ?? undefined,
          email: order.restaurant?.email ?? undefined,
          devise: "F CFA",
        },
        {},
      );

      if (result.mode === "ERREUR") {
        toast.error(result.message ?? "Impossible d'imprimer le ticket");
        return;
      }

      // Toast contextuel seulement si fallback (sinon silencieux pour USB/BT)
      if (result.fallback && result.mode === "HTML") {
        toast(
          `Imprimante non détectée — ticket ouvert dans le navigateur${result.message ? ` (${result.message})` : ""}`,
          { icon: "🖨️" },
        );
      } else if (result.mode === "HTML") {
        toast("Ticket ouvert dans le navigateur", { icon: "🖨️" });
      }
    } catch (err) {
      console.error("[printOrder] Erreur inattendue:", err);
      toast.error("Erreur lors de l'impression");
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

        if (status === OrderStatus.IN_PROGRESS) {
          printOrder(order);
        }
        if (status === OrderStatus.CANCELLED) {
          toggleModal("orders", "to_cancel")
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

        const order = await getOrderById(orderId);

        if (!order) {
          throw new Error("Commande introuvable");
        }

        await printOrder(order);
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

  const handleToggleOrderModal = useCallback(
    (order: OrderTable, modalName: string) => {
      toggleModal('orders', modalName)
      setSelectedItem("orders", order)
    }, [toggleModal, setSelectedItem])

  // handle pour passer en mode édition de commande
  const handleEditOrder = useCallback(
    (order: OrderTable) => {
      setSelectedItem("orders", order);
      setSectionView("orders", "edit");
    },
    [setSelectedItem, setSectionView]
  );

  // handle pour ouvrir le modal de suppression
  const handleDeleteOrder = useCallback(
    (order: OrderTable) => {
      setSelectedItem("orders", order);
      toggleModal("orders", "to_delete");
    },
    [setSelectedItem, toggleModal]
  );

  return {
    handleViewOrderDetails,
    handleOrderUpdateStatus,
    handlePrintOrder,
    handleEditOrder,
    handleDeleteOrder,
    isLoading: isUpdateStatusLoading || printingLoading,
    handleToggleOrderModal
  };
};
