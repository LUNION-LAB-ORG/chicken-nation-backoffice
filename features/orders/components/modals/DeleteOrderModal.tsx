"use client";

import { useState } from "react";
import { useOrderActions } from "../../hooks/useOrderActions";
import { useOrderDeleteMutation } from "../../queries/order-delete.mutation";
import { OrderTable } from "../../types/ordersTable.types";
import { useDashboardStore } from "@/store/dashboardStore";

interface DeleteOrderModalProps {
  isOpen: boolean;
  order: OrderTable;
}

export function DeleteOrderModal({ isOpen, order }: DeleteOrderModalProps) {
  const { handleToggleOrderModal } = useOrderActions();
  const { mutateAsync: deleteOrder, isPending } = useOrderDeleteMutation();
  const { setSectionView } = useDashboardStore();
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleDelete = async () => {
    try {
      setError(null);
      await deleteOrder(order.id);
      handleToggleOrderModal(order, "to_delete");
      setSectionView("orders", "list");
    } catch (e: any) {
      setError(e.message || "Erreur lors de la suppression");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl p-6 max-w-md w-full">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          Supprimer la commande
        </h2>

        <p className="text-gray-700 mb-2">
          Êtes-vous sûr de vouloir supprimer la commande{" "}
          <strong>{order.reference}</strong> ?
        </p>
        <p className="text-red-600 text-sm mb-4">
          Cette action est irréversible. Toutes les données de cette commande
          seront définitivement supprimées.
        </p>

        {error && (
          <p className="text-red-500 text-sm mb-4 bg-red-50 p-2 rounded-lg">
            {error}
          </p>
        )}

        <div className="flex gap-3 mt-6">
          <button
            onClick={() => handleToggleOrderModal(order, "to_delete")}
            className="w-full py-3 rounded-lg border border-gray-300 cursor-pointer hover:bg-gray-50"
          >
            Annuler
          </button>

          <button
            onClick={handleDelete}
            disabled={isPending}
            className="w-full py-3 rounded-lg bg-red-600 text-white font-semibold cursor-pointer hover:bg-red-700 disabled:opacity-50"
          >
            {isPending ? "Suppression..." : "Supprimer"}
          </button>
        </div>
      </div>
    </div>
  );
}
