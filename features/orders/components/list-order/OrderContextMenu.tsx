import { useRBAC } from "@/hooks/useRBAC";
import { X } from "lucide-react";
import Image from "next/image";
import React from "react";
import { OrderTable, OrderTableStatus } from "../../types/ordersTable.types";
import { useOrderActions } from "../../hooks/useOrderActions";
import { OrderStatus } from "../../types/order.types";

interface OrderContextMenuProps {
  order: OrderTable;
  isOpen: boolean;
  onClose: () => void;
}

const OrderContextMenu: React.FC<OrderContextMenuProps> = ({
  order,
  isOpen,
  onClose,
}) => {
  const {
    handleViewOrderDetails,
    handleOrderUpdateStatus,
    handlePrintOrder,
    isLoading,
    handleToggleOrderModal,
  } = useOrderActions();

  const { canAcceptCommande, canRejectCommande, canViewCommande } = useRBAC();

  const isAccepted = order.status !== OrderTableStatus.NOUVELLE;

  const handleAccept = () => {
    handleOrderUpdateStatus(order.id, OrderStatus.ACCEPTED);
    onClose();
  };

  const handleReject = () => {
    handleToggleOrderModal(order, "to_cancel");
    onClose();
  };

  const handleViewDetails = () => {
    handleViewOrderDetails(order);
    if (!isLoading) {
      onClose();
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
    <>
      <div className="order-context-menu w-56 bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200">
        <div className="py-1">
          {!isAccepted ? (
            <>
              {canAcceptCommande && (
                <button
                  type="button"
                  className="w-full px-4 py-2 text-left text-sm flex items-center gap-2 text-[#F17922] hover:bg-gray-50 cursor-pointer"
                  onClick={handleAccept}
                >
                  <Image
                    src="/icons/check.png"
                    alt="Accepter"
                    width={20}
                    height={20}
                  />
                  <span>Accepter la commande</span>
                </button>
              )}
              {canRejectCommande && (
                <button
                  type="button"
                  className="w-full px-4 py-2 text-left text-sm flex items-center font-semibold  gap-2 text-red-600 hover:bg-gray-50 cursor-pointer"
                  onClick={handleReject}
                >
                  <X size={16} />
                  <span>Refuser</span>
                </button>
              )}
              {canViewCommande && (
                <button
                  type="button"
                  className="w-full px-4 py-2 text-left text-sm flex items-center font-semibold gap-2 text-[#888891] hover:bg-orange-50 cursor-pointer"
                  onClick={handleViewDetails}
                >
                  <span>Voir les détails</span>
                </button>
              )}
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => handlePrintOrder(order.id)}
                className="w-full px-4 py-2 text-left text-sm flex items-center font-semibold gap-2 text-[#888891] hover:bg-orange-50 cursor-pointer"
              >
                <span>Imprimer</span>
              </button>
              {canViewCommande && (
                <button
                  type="button"
                  className="w-full px-4 py-2 text-left text-sm flex items-center font-semibold gap-2 text-[#888891] hover:bg-orange-50 cursor-pointer"
                  onClick={handleViewDetails}
                >
                  <span>Voir les détails</span>
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default OrderContextMenu;
