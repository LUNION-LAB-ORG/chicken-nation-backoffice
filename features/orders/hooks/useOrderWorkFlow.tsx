import { useRBAC } from "@/hooks/useRBAC";
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
  const { canAcceptCommande, canRejectCommande, canUpdateCommande } = useRBAC();

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
              onClick: () =>
                handleOrderUpdateStatus(order.id, OrderStatus.COLLECTED),
              variant: "primary",
            },
            ...(!order.paied
              ? [
                  {
                    label: isLoading ? "Chargement..." : "Payer",
                    onClick: () =>
                      handleToggleOrderModal(order, "add_paiement"),
                    variant: "primary",
                  } as WorkflowAction,
                ]
              : []),
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
            label: isLoading ? "Chargement..." : "En Livraison",
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

    case "LIVRAISON":
      return {
        badgeText: "Commande en livraison",
        actions: [
          {
            label: isLoading ? "Chargement..." : "Imprimer",
            onClick: () => handlePrintOrder(order.id),
            variant: "secondary",
          },
          {
            label: isLoading ? "Chargement..." : "Chez le client",
            onClick: () =>
              handleOrderUpdateStatus(order.id, OrderStatus.COLLECTED),
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
    case "COLLECTÉ":
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
              if (order.paiements.length > 0) {
                return handleOrderUpdateStatus(order.id, OrderStatus.COMPLETED);
              }
              return handleToggleOrderModal(order, "add_paiement");
            },
            variant: "primary",
          },
        ],
      };
    case "TERMINÉ":
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
