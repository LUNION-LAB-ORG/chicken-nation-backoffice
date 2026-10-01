import React from "react";
import { useOrderActions } from "../../hooks/useOrderActions";
import { OrderStatus } from "../../types/order.types";
import { OrderTable } from "../../types/ordersTable.types";
import { useDroitsCommande } from "../../hooks/useDroitsCommande";
import { actionsCommande, type ActionCommande } from "../../utils/order-actions-rules";
import { OrderActionItems } from "../actions/OrderActionItems";

interface OrderContextMenuProps {
  order: OrderTable;
  isOpen: boolean;
  onClose: () => void;
  /** Si fourni, "Voir les détails" ouvre le drawer au lieu de l'ancienne vue détail */
  onViewDetails?: (order: OrderTable) => void;
}

// Mapping inverse conservé pour compat (cas où on aurait un label sans rawStatus).
// Préférer `order.rawStatus` directement quand dispo.
const STATUS_REVERSE_MAP: Record<string, OrderStatus> = {
  "EN ATTENTE": OrderStatus.PENDING,
  "NOUVELLE": OrderStatus.ACCEPTED,
  "EN PRÉPARATION": OrderStatus.IN_PROGRESS,
  "PRÊT": OrderStatus.READY,
  "EN LIVRAISON": OrderStatus.PICKED_UP,
  "RÉCUPÉRÉE": OrderStatus.COLLECTED,
  "ANNULÉE": OrderStatus.CANCELLED,
  "TERMINÉE": OrderStatus.COMPLETED,
};

const OrderContextMenu: React.FC<OrderContextMenuProps> = ({
  order,
  isOpen,
  onClose,
  onViewDetails,
}) => {
  const {
    handleViewOrderDetails,
    handleOrderUpdateStatus,
    handlePrintOrder,
    handleEditOrder,
    handleDeleteOrder,
    isLoading,
    handleToggleOrderModal,
  } = useOrderActions();

  // Statut brut du serveur ; repli sur le libellé pour compatibilité.
  const apiStatus = order.rawStatus ?? STATUS_REVERSE_MAP[order.status];
  // Droits : module de règles partagé avec le menu ⋮ du tiroir
  // (features/orders/utils/order-actions-rules.ts). Rien n'est recalculé ici.
  const droits = useDroitsCommande();
  const actions = actionsCommande(apiStatus, droits, "liste");

  const handleViewDetails = () => {
    if (onViewDetails) {
      onViewDetails(order);
    } else {
      handleViewOrderDetails(order);
    }
    if (!isLoading) {
      onClose();
    }
  };

  const handleAction = (action: ActionCommande) => {
    switch (action) {
      case "accepter":
        handleOrderUpdateStatus(order.id, OrderStatus.IN_PROGRESS);
        onClose();
        return;
      case "refuser":
      case "annuler":
        // Même modal d'annulation (message de remboursement si payée).
        handleToggleOrderModal(order, "to_cancel");
        onClose();
        return;
      case "imprimer":
        handlePrintOrder(order.id);
        return;
      case "voir":
        handleViewDetails();
        return;
      case "modifier":
        handleEditOrder(order);
        onClose();
        return;
      case "supprimer":
        handleDeleteOrder(order);
        onClose();
        return;
    }
  };

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isOpen &&
        !(event.target as Element).closest(".order-context-menu") &&
        !(event.target as Element).closest(".menu-button")
      ) {
        if (!isLoading) {
          onClose();
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="order-context-menu w-56 bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200">
      <div className="py-1">
        <OrderActionItems actions={actions} onAction={handleAction} />
      </div>
    </div>
  );
};

export default OrderContextMenu;
