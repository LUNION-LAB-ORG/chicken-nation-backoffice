import { OrderStatus, OrderType } from "../types/order.types";
import { OrderTable } from "../types/ordersTable.types";
import { useOrderActions } from "./useOrderActions";

interface WorkflowAction {
  label: string;
  variant?: "danger" | "secondary" | "primary";
  onClick?: () => void;
}
interface WorkflowConfig {
  badgeText: string | null;
  actions?: WorkflowAction[];
}

export const useOrderWorkFlow = ({ order }: { order: OrderTable }) => {
  const actions = useOrderActions();
  return {
    getWorkFlow: buildWorkFlow(order, actions),
  };
};

/**
 * Workflow d'actions par statut de commande.
 *
 * Source de vérité : `order.rawStatus` (enum Prisma) + `order.orderType`.
 * On ne switche PAS sur `order.status` (= libellé d'affichage) pour éviter
 * tout couplage entre l'UX label et la logique métier.
 *
 * Séquences valides (cf. backend validateStatusTransition) :
 *  - DELIVERY     : PENDING → ACCEPTED → IN_PROGRESS → READY → PICKED_UP → COLLECTED → COMPLETED
 *  - PICKUP/TABLE : PENDING → ACCEPTED → IN_PROGRESS → READY → COLLECTED → COMPLETED
 *
 * Règles métier :
 *  - Quand le client récupère sa commande (PICKUP/TABLE READY → COLLECTED, ou
 *    DELIVERY PICKED_UP → COLLECTED) :
 *      * si payée → on enchaîne directement vers COMPLETED
 *      * sinon → on s'arrête à COLLECTED ; la commande reste visible dans
 *        « En cours » avec un bouton « Payer » qui complétera après paiement
 *        (cf. paiement-add.mutation auto-complete COLLECTED → COMPLETED).
 */
type OrderActions = ReturnType<typeof useOrderActions>;

/**
 * Calcule le workflow d'actions pour une commande donnée.
 *
 * Volontairement NOMMÉ `buildWorkFlow` (pas `useWorkFlow`) : il ne consomme
 * pas de hook React, il prend les actions en paramètre — c'est le hook
 * `useOrderWorkFlow` qui s'occupe d'appeler `useOrderActions()` une fois.
 */
export const buildWorkFlow = (
  order: OrderTable,
  actions: OrderActions,
): WorkflowConfig => {
  const {
    handleOrderUpdateStatus,
    handlePrintOrder,
    handleToggleOrderModal,
    isLoading,
  } = actions;

  const isDelivery = order.orderType === "À livrer";
  const isPickupOrTable = !isDelivery; // À récupérer ou À table

  /** Passe directement à COMPLETED si déjà payée, sinon à `intermediate` */
  const collectAndCompleteIfPaid = (intermediate: OrderStatus) => async () => {
    if (order.paied) {
      // Backend autorise les sauts vers COMPLETED (cf. validateStatusTransition).
      // Un seul appel suffit, transition direct READY/PICKED_UP → COMPLETED.
      return handleOrderUpdateStatus(order.id, OrderStatus.COMPLETED);
    }
    return handleOrderUpdateStatus(order.id, intermediate);
  };

  switch (order.rawStatus) {
    case OrderStatus.PENDING:
      return {
        badgeText: "Commande en attente",
        actions: [
          {
            label: isLoading ? "Chargement..." : "Rejeter",
            onClick: () => handleToggleOrderModal(order, "to_cancel"),
            variant: "danger",
          },
          {
            label: isLoading ? "Chargement..." : "Confirmer",
            onClick: () =>
              handleOrderUpdateStatus(order.id, OrderStatus.ACCEPTED),
            variant: "primary",
          },
        ],
      };

    case OrderStatus.ACCEPTED:
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
              handleOrderUpdateStatus(order.id, OrderStatus.IN_PROGRESS),
            variant: "primary",
          },
        ],
      };

    case OrderStatus.CANCELLED:
      return {
        badgeText: "Commande annulée",
        actions: [],
      };

    case OrderStatus.IN_PROGRESS:
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

    case OrderStatus.READY: {
      // PICKUP / TABLE : pas d'étape PICKED_UP — le client récupère directement.
      if (isPickupOrTable) {
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
              onClick: collectAndCompleteIfPaid(OrderStatus.COLLECTED),
              variant: "primary",
            },
          ],
        };
      }

      // DELIVERY : étape intermédiaire PICKED_UP (livreur a pris).
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

    case OrderStatus.PICKED_UP:
      // DELIVERY uniquement (séquence backend invalide en PICKUP/TABLE).
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
            onClick: collectAndCompleteIfPaid(OrderStatus.COLLECTED),
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

    case OrderStatus.COLLECTED:
      // Le client a déjà récupéré sa commande. Si payée, on devrait normalement
      // être passé en COMPLETED. Cas restant : COLLECTED + non payée (modal
      // paiement ouverte ailleurs, ou collected via un autre flux).
      return {
        badgeText: isPickupOrTable
          ? "Commande récupérée par le client"
          : "Commande livrée au client",
        actions: [
          {
            label: isLoading ? "Chargement..." : "Imprimer",
            onClick: () => handlePrintOrder(order.id),
            variant: "secondary",
          },
          ...(!order.paied
            ? [
                {
                  label: isLoading ? "Chargement..." : "Payer",
                  onClick: () => handleToggleOrderModal(order, "add_paiement"),
                  variant: "primary",
                } as WorkflowAction,
              ]
            : [
                {
                  label: isLoading ? "Chargement..." : "Terminer",
                  onClick: () =>
                    handleOrderUpdateStatus(order.id, OrderStatus.COMPLETED),
                  variant: "primary",
                } as WorkflowAction,
              ]),
        ],
      };

    case OrderStatus.COMPLETED:
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

    default: {
      // Garde-fou exhaustif TypeScript.
      const _exhaustive: never = order.rawStatus;
      void _exhaustive;
      void OrderType; // évite l'erreur unused import si jamais
      return { badgeText: null };
    }
  }
};
