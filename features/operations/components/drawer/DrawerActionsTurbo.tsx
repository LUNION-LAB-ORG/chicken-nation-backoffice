"use client";

import React from "react";
import { Info } from "lucide-react";

import { useOrderActions } from "../../../orders/hooks/useOrderActions";
import { OrderStatus, type Order } from "../../../orders/types/order.types";
import { DrawerCancelAction } from "./DrawerCancelAction";

interface Props {
  order: Order;
}

/**
 * Workflow manuel legacy pour les commandes gérées par Turbo Delivery.
 * Pas d'intégration applicative Turbo → la caissière doit faire toutes les transitions à la main.
 */
export const DrawerActionsTurbo: React.FC<Props> = ({ order }) => {
  const { handleOrderUpdateStatus, isLoading } = useOrderActions();

  const transitions: { from: OrderStatus; to: OrderStatus; label: string; tone: string }[] = [
    { from: OrderStatus.ACCEPTED, to: OrderStatus.IN_PROGRESS, label: "Commencer la préparation", tone: "bg-[#F17922]" },
    { from: OrderStatus.IN_PROGRESS, to: OrderStatus.READY, label: "Marquer comme prête", tone: "bg-green-600" },
    { from: OrderStatus.READY, to: OrderStatus.PICKED_UP, label: "Commande récupérée par Turbo", tone: "bg-indigo-600" },
    { from: OrderStatus.PICKED_UP, to: OrderStatus.COLLECTED, label: "Livrée au client", tone: "bg-emerald-600" },
    { from: OrderStatus.COLLECTED, to: OrderStatus.COMPLETED, label: "Terminer la commande", tone: "bg-gray-700" },
  ];

  const next = transitions.find((t) => t.from === order.status);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 rounded-lg bg-blue-50 border border-blue-200 px-3 py-2">
        <Info className="w-4 h-4 text-blue-600 shrink-0" />
        <p className="text-xs text-blue-800">
          Livraison gérée par <strong>Turbo Delivery</strong> — workflow manuel.
        </p>
      </div>

      {next ? (
        <button
          onClick={() => handleOrderUpdateStatus(order.id, next.to)}
          disabled={isLoading}
          className={`w-full py-3 text-white font-semibold rounded-lg disabled:bg-gray-300 ${next.tone}`}
        >
          {isLoading ? "…" : next.label}
        </button>
      ) : (
        <p className="text-sm text-gray-500 text-center py-4">
          Commande terminée — aucune action disponible.
        </p>
      )}
      <DrawerCancelAction order={order} />
    </div>
  );
};
