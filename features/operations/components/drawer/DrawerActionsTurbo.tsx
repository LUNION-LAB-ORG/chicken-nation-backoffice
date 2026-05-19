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
 * Workflow manuel legacy pour les commandes DELIVERY gérées par Turbo Delivery.
 *
 * À n'utiliser que pour `order.type === DELIVERY` — pour PICKUP/TABLE, utiliser
 * `DrawerActionsClient` (séquence sans PICKED_UP, le client récupère lui-même).
 *
 * Auto-complete : si la commande est déjà payée au moment où on la marque
 * collectée, on saute directement à COMPLETED.
 */
export const DrawerActionsTurbo: React.FC<Props> = ({ order }) => {
  const { handleOrderUpdateStatus, isLoading } = useOrderActions();

  const isPickedUpAndPaid =
    order.status === OrderStatus.PICKED_UP && order.paied;
  const isCollectedAndPaid =
    order.status === OrderStatus.COLLECTED && order.paied;

  const transitions: { from: OrderStatus; to: OrderStatus; label: string; tone: string }[] = [
    { from: OrderStatus.ACCEPTED, to: OrderStatus.IN_PROGRESS, label: "Commencer la préparation", tone: "bg-[#F17922]" },
    { from: OrderStatus.IN_PROGRESS, to: OrderStatus.READY, label: "Marquer comme prête", tone: "bg-green-600" },
    { from: OrderStatus.READY, to: OrderStatus.PICKED_UP, label: "Livreur a récupéré", tone: "bg-indigo-600" },
    {
      from: OrderStatus.PICKED_UP,
      to: isPickedUpAndPaid ? OrderStatus.COMPLETED : OrderStatus.COLLECTED,
      label: isPickedUpAndPaid ? "Livrée au client + terminer" : "Livrée au client",
      tone: "bg-emerald-600",
    },
    {
      from: OrderStatus.COLLECTED,
      to: OrderStatus.COMPLETED,
      label: isCollectedAndPaid ? "Terminer la commande" : "Terminer (payer d'abord)",
      tone: "bg-gray-700",
    },
  ];

  const next = transitions.find((t) => t.from === order.status);
  const disableNext =
    isLoading ||
    (order.status === OrderStatus.COLLECTED && !order.paied);

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
          disabled={disableNext}
          className={`w-full py-3 text-white font-semibold rounded-lg disabled:bg-gray-300 ${next.tone}`}
          title={
            order.status === OrderStatus.COLLECTED && !order.paied
              ? "Enregistrez d'abord le paiement via l'onglet Paiement"
              : undefined
          }
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
