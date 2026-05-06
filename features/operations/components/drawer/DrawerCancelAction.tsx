"use client";

import React, { useState } from "react";
import { AlertTriangle, X } from "lucide-react";

import { useOrderActions } from "../../../orders/hooks/useOrderActions";
import { OrderStatus, type Order } from "../../../orders/types/order.types";

interface Props {
  order: Order;
}

/**
 * Bouton "Annuler la commande" avec confirmation inline dans le drawer.
 * Utilisé dans DrawerActionsChickenNation et DrawerActionsTurbo.
 *
 * Statuts annulables : ACCEPTED, IN_PROGRESS, READY (avant récupération).
 */
const CANCELLABLE = new Set<OrderStatus>([
  OrderStatus.ACCEPTED,
  OrderStatus.IN_PROGRESS,
  OrderStatus.READY,
]);

export const DrawerCancelAction: React.FC<Props> = ({ order }) => {
  const [confirming, setConfirming] = useState(false);
  const { handleOrderUpdateStatus, isLoading } = useOrderActions();

  if (!CANCELLABLE.has(order.status)) return null;

  if (confirming) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-3 space-y-3">
        <div className="flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-gray-900">Annuler la commande ?</p>
            <p className="text-xs text-gray-600 mt-0.5">
              {order.paied
                ? "Cette commande a déjà été payée. Le client sera automatiquement remboursé."
                : "Cette commande n'a pas encore été payée. Elle sera simplement annulée."}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setConfirming(false)}
            className="flex-1 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
          >
            Retour
          </button>
          <button
            type="button"
            disabled={isLoading}
            onClick={() => handleOrderUpdateStatus(order.id, OrderStatus.CANCELLED)}
            className="flex-1 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition disabled:opacity-60"
          >
            {isLoading ? "Annulation…" : "Confirmer"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setConfirming(true)}
      className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl border border-red-200 text-red-600 text-sm font-semibold hover:bg-red-50 transition"
    >
      <X className="w-4 h-4" />
      Annuler la commande
    </button>
  );
};
