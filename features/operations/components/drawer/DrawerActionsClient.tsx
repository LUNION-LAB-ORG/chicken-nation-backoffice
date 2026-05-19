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
 * Workflow d'actions pour les commandes PICKUP (à emporter) et TABLE (sur place).
 *
 * Séquence backend valide : PENDING → ACCEPTED → IN_PROGRESS → READY → COLLECTED → COMPLETED.
 * Pas d'étape PICKED_UP — c'est le client qui vient récupérer, pas un livreur.
 *
 * Auto-complete : si la commande est déjà payée au moment où on la marque
 * récupérée, on saute directement à COMPLETED (le backend autorise les sauts
 * vers COMPLETED). Sinon on s'arrête à COLLECTED et le bouton « Payer » du
 * tab paiement déclenchera l'auto-complete via paiement-add.mutation.
 */
export const DrawerActionsClient: React.FC<Props> = ({ order }) => {
  const { handleOrderUpdateStatus, isLoading } = useOrderActions();

  const isReadyAndPaid = order.status === OrderStatus.READY && order.paied;
  const isCollectedAndPaid =
    order.status === OrderStatus.COLLECTED && order.paied;

  const transitions: {
    from: OrderStatus;
    to: OrderStatus;
    label: string;
    tone: string;
  }[] = [
    {
      from: OrderStatus.ACCEPTED,
      to: OrderStatus.IN_PROGRESS,
      label: "Commencer la préparation",
      tone: "bg-[#F17922]",
    },
    {
      from: OrderStatus.IN_PROGRESS,
      to: OrderStatus.READY,
      label: "Marquer comme prête",
      tone: "bg-green-600",
    },
    {
      from: OrderStatus.READY,
      // Auto-complete si payée pour éviter de bloquer sur COLLECTED.
      to: isReadyAndPaid ? OrderStatus.COMPLETED : OrderStatus.COLLECTED,
      label: isReadyAndPaid
        ? "Client a récupéré + terminer"
        : "Client a récupéré",
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
  // Sur COLLECTED non payé : on n'autorise pas COMPLETED tant que pas payé
  // (le backend rejettera de toute façon avec "La commande n'a pas été payée").
  const disableNext =
    isLoading ||
    (order.status === OrderStatus.COLLECTED && !order.paied);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 rounded-lg bg-orange-50 border border-orange-200 px-3 py-2">
        <Info className="w-4 h-4 text-orange-600 shrink-0" />
        <p className="text-xs text-orange-800">
          Commande {order.type === "PICKUP" ? "à emporter" : "à table"} —
          récupérée directement par le client.
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
