import { useRBAC } from "@/hooks/useRBAC";
import { OrderTable, OrderTableStatus } from "../types/ordersTable.types";
import { useOrderActions } from "./useOrderActions";
import { OrderStatus } from "../types/order.types";

interface WorkflowConfig {
  badgeText: string;
  actions?: {
    label: string | null;
    variant?: "danger" | "secondary" | "primary";
    onClick?: () => void;
  }[];
}

export const useOrderWorkFlow = ({ order }: { order: OrderTable }) => {
  return {
    getWorkFlow: getWorkFlow(order),
  };
};

export const getWorkFlow = (order: OrderTable): WorkflowConfig => {
  const {
    handleOrderUpdateStatus,
    handlePrintOrder,
    handleToggleOrderModal,
    isLoading,
  } = useOrderActions();
  const { canAcceptCommande, canRejectCommande, canUpdateCommande } = useRBAC();

  switch (order.status) {
    case OrderTableStatus["NOUVELLE"]:
      return {
        badgeText: "Nouvelle commande",
        actions: [
          {
            label: "Refuser",
            onClick: () => handleToggleOrderModal(order, "to_cancel"),
            variant: "danger",
          },
          {
            label: "Accepter",
            onClick: () =>
              handleOrderUpdateStatus(order.id, OrderStatus.ACCEPTED),
            variant: "primary",
          },
        ],
      };
    case OrderTableStatus["ANNULÉE"]:
      return {
        badgeText: "Commande annulée",
        actions: [],
      };
    case OrderTableStatus["EN COURS"]:
      return {
        badgeText: "Commande acceptée",
        actions: [
          {
            label: "Refuser",
            onClick: () => handleToggleOrderModal(order, "to_cancel"),
            variant: "danger",
          },
          {
            label: "Imprimer",
            onClick: () => handlePrintOrder(order.id),
            variant: "secondary",
          },
          {
            label: "Préparer",
            onClick: () =>
              handleOrderUpdateStatus(order.id, OrderStatus.IN_PROGRESS),
            variant: "primary",
          },
        ],
      };
    case OrderTableStatus["EN PRÉPARATION"]:
      return {
        badgeText: "Commande en préparation",
        actions: [
          {
            label: "Refuser",
            onClick: () => handleToggleOrderModal(order, "to_cancel"),
            variant: "danger",
          },
          {
            label: "Imprimer",
            onClick: () => handlePrintOrder(order.id),
            variant: "secondary",
          },
          {
            label: "Prêt",
            onClick: () => handleOrderUpdateStatus(order.id, OrderStatus.READY),
            variant: "primary",
          },
        ],
      };
    case OrderTableStatus["PRÊT"]: {
      if (order.orderType == "À récupérer" || order.orderType == "À table") {
        return {
          badgeText: "Commande prête",
          actions: [
            {
              label: "Imprimer",
              onClick: () => handlePrintOrder(order.id),
              variant: "secondary",
            },
            {
              label: "Client a récupéré",
              onClick: () =>
                handleOrderUpdateStatus(order.id, OrderStatus.COLLECTED),
              variant: "primary",
            },
          ],
        };
      }
      return {
        badgeText: "Commande prête",
        actions: [
          {
            label: "Imprimer",
            onClick: () => handlePrintOrder(order.id),
            variant: "secondary",
          },
          {
            label: "Marquer en Livraison",
            onClick: () =>
              handleOrderUpdateStatus(order.id, OrderStatus.PICKED_UP),
            variant: "primary",
          },
        ],
      };
    }

    case OrderTableStatus["LIVRAISON"]:
      return {
        badgeText: "Commande en livraison",
        actions: [
          {
            label: "Imprimer",
            onClick: () => handlePrintOrder(order.id),
            variant: "secondary",
          },
          {
            label: "Client a récupéré",
            onClick: () =>
              handleOrderUpdateStatus(order.id, OrderStatus.COLLECTED),
            variant: "primary",
          },
        ],
      };
    case OrderTableStatus["COLLECTÉ"]:
      return {
        badgeText: "Commande récupérée par le client",
        actions: [
          {
            label: "Imprimer",
            onClick: () => handlePrintOrder(order.id),
            variant: "secondary",
          },
          {
            label: "Terminer",
            onClick: () =>
              handleOrderUpdateStatus(order.id, OrderStatus.COMPLETED),
            variant: "primary",
          },
        ],
      };
    case OrderTableStatus["TERMINÉ"]:
      return {
        badgeText: "Commande terminée",
        actions: [
          {
            label: "Imprimer",
            onClick: () => handlePrintOrder(order.id),
            variant: "primary",
          },
        ],
      };
    default:
      return {
        badgeText: null,
      };
  }
};
