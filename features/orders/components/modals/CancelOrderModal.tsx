"use client";

import { useOrderActions } from "../../hooks/useOrderActions";
import { OrderStatus } from "../../types/order.types";
import { OrderTable } from "../../types/ordersTable.types";

interface CancelOrderModalProps {
  isOpen: boolean;
  order: OrderTable;
}

export function CancelOrderModal({ isOpen, order }: CancelOrderModalProps) {
  const isPaid = order.paied;

  const { handleOrderUpdateStatus, isLoading, handleToggleOrderModal } =
    useOrderActions();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl p-6 max-w-md w-full">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          Annuler la commande
        </h2>

        {isPaid ? (
          <p className="text-gray-700 mb-4">
            ⚠️ Cette commande a déjà été payée.
            <br />
            <br />
            Le client sera <strong>automatiquement remboursé</strong>.
            <br />
            Si le remboursement automatique échoue, un
            <strong> remboursement manuel</strong> devra être effectué.
          </p>
        ) : (
          <p className="text-gray-700 mb-4">
            Cette commande n&apos;a pas encore été payée.
            <br />
            Elle sera simplement annulée.
          </p>
        )}

        <div className="flex gap-3 mt-6">
          <button
            onClick={() => handleToggleOrderModal(order, "to_cancel")}
            className="w-full py-3 rounded-lg border border-gray-300 cursor-pointer"
          >
            Retour
          </button>

          <button
            onClick={() =>
              handleOrderUpdateStatus(order.id, OrderStatus.CANCELLED)
            }
            className="w-full py-3 rounded-lg bg-red-600 text-white font-semibold cursor-pointer"
          >
            {isLoading ? "Traitement..." : "Confirmer l'annulation"}
          </button>
        </div>
      </div>
    </div>
  );
}
