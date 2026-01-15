import { OrderStatus } from "../types/order.types";
import { OrderTable } from "../types/ordersTable.types";
import { useOrderActions } from "./useOrderActions";

interface WorkflowAction {
  label: string;
  variant?: "danger" | "secondary" | "primary";
  onClick?: () => void;
}
interface WorkflowConfig {
  badgeText: string;
  actions?: WorkflowAction[];
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

  switch (order.status) {
    case "NOUVELLE":
      return {
        badgeText: "Nouvelle commande",
        actions: [
          {
            label: isLoading ? "Chargement..." : "Refuser",
            onClick: () => handleToggleOrderModal(order, "to_cancel"),
            variant: "danger",
          },
          {
            label: isLoading ? "Chargement..." : "Accepter",
            onClick: () =>
              handleOrderUpdateStatus(order.id, OrderStatus.ACCEPTED),
            variant: "primary",
          },
        ],
      };
    case "ANNULÉE":
      return {
        badgeText: "Commande annulée",
        actions: [],
      };
    case "EN COURS":
      return {
        badgeText: "Commande acceptée",
        actions: [
          {
            label: isLoading ? "Chargement..." : "Refuser",
            onClick: () => handleToggleOrderModal(order, "to_cancel"),
            variant: "danger",
          },
          {
            label: isLoading ? "Chargement..." : "Imprimer",
            onClick: () => handlePrintOrder(order.id),
            variant: "secondary",
          },
          {
            label: isLoading ? "Chargement" : "Préparer",
            onClick: () =>
              handleOrderUpdateStatus(order.id, OrderStatus.IN_PROGRESS),
            variant: "primary",
          },
        ],
      };
    case "EN PRÉPARATION":
      return {
        badgeText: "Commande en préparation",
        actions: [
          {
            label: isLoading ? "Chargement..." : "Refuser",
            onClick: () => handleToggleOrderModal(order, "to_cancel"),
            variant: "danger",
          },
          {
            label: isLoading ? "Chargement..." : "Imprimer",
            onClick: () => handlePrintOrder(order.id),
            variant: "secondary",
          },
          {
            label: isLoading ? "Chargement..." : "Prêt",
            onClick: () => handleOrderUpdateStatus(order.id, OrderStatus.READY),
            variant: "primary",
          },
        ],
      };
    case "PRÊT": {
      if (order.orderType == "À récupérer" || order.orderType == "À table") {
        return {
          badgeText: "Commande prête",
          actions: [
            {
              label: isLoading ? "Chargement..." : "Imprimer",
              onClick: () => handlePrintOrder(order.id),
              variant: "secondary",
            },
            {
              label: isLoading ? "Chargement..." : "Client a récupéré",
              onClick: () => {
                if (order.paied) {
                  return handleOrderUpdateStatus(
                    order.id,
                    OrderStatus.COMPLETED
                  );
                }
                return handleToggleOrderModal(order, "add_paiement");
              },
              variant: "primary",
            },
          ],
        };
      }
      return {
        badgeText: "Commande prête",
        actions: [
          {
            label: isLoading ? "Chargement..." : "Imprimer",
            onClick: () => handlePrintOrder(order.id),
            variant: "secondary",
          },
          {
            label: isLoading ? "Chargement..." : "Livreur a récupéré",
            onClick: () =>
              handleOrderUpdateStatus(order.id, OrderStatus.PICKED_UP),
            variant: "primary",
          },
          ...(!order.paied
            ? [
                {
                  label: isLoading ? "Chargement..." : "Payer",
                  onClick: () => handleToggleOrderModal(order, "add_paiement"),
                  variant: "primary",
                } as WorkflowAction,
              ]
            : []),
        ],
      };
    }

    case "COLLECTÉE":
      return {
        badgeText: "Commande en livraison",
        actions: [
          {
            label: isLoading ? "Chargement..." : "Imprimer",
            onClick: () => handlePrintOrder(order.id),
            variant: "secondary",
          },
          {
            label: isLoading ? "Chargement..." : "Client a reçu",
            onClick: () => {
              if (order.paied) {
                return handleOrderUpdateStatus(order.id, OrderStatus.COMPLETED);
              }
              return handleOrderUpdateStatus(order.id, OrderStatus.COLLECTED);
            },
            variant: "primary",
          },
          ...(!order.paied
            ? [
                {
                  label: isLoading ? "Chargement..." : "Payer",
                  onClick: () => handleToggleOrderModal(order, "add_paiement"),
                  variant: "primary",
                } as WorkflowAction,
              ]
            : []),
        ],
      };
    case "LIVRÉE":
      return {
        badgeText: "Commande récupérée par le client",
        actions: [
          {
            label: isLoading ? "Chargement..." : "Imprimer",
            onClick: () => handlePrintOrder(order.id),
            variant: "secondary",
          },
          {
            label: isLoading ? "Chargement..." : "Terminer",
            onClick: () => {
              if (order.paied) {
                return handleOrderUpdateStatus(order.id, OrderStatus.COMPLETED);
              }
              return handleToggleOrderModal(order, "add_paiement");
            },
            variant: "primary",
          },
        ],
      };
    case "TERMINÉE":
      return {
        badgeText: "Commande terminée",
        actions: [
          {
            label: isLoading ? "Chargement..." : "Imprimer",
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
