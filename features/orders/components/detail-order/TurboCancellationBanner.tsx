"use client";

import React from "react";
import { AlertTriangle } from "lucide-react";

import { OrderStatus } from "../../types/order.types";
import { OrderTable } from "../../types/ordersTable.types";

/**
 * Bannière « Course annulée par Turbo » — annulation DÉCOUPLÉE : Turbo n'annule
 * plus la commande, seulement sa course. La commande reste vivante et le staff
 * décide : relancer une livraison (page Courses → « Relancer ») ou annuler la
 * commande manuellement, comme aujourd'hui.
 *
 * Affichée dans le drawer « En cours » ET le détail commande. Disparaît d'elle-
 * même quand la situation est résolue : commande annulée manuellement, terminée,
 * ou livraison relancée (la relance déplace la livraison sur une NOUVELLE course
 * et purge la raison).
 */
export default function TurboCancellationBanner({
  order,
  className = "",
}: {
  order: OrderTable;
  className?: string;
}) {
  const info = order.courseCancellation;
  if (!info) return null;
  if (
    order.rawStatus === OrderStatus.CANCELLED ||
    order.rawStatus === OrderStatus.COMPLETED ||
    order.rawStatus === OrderStatus.COLLECTED
  ) {
    return null; // situation résolue — plus rien à décider
  }

  return (
    <div
      className={`flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 ${className}`}
    >
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
      <div className="min-w-0 text-xs leading-relaxed">
        <p className="font-bold text-red-700">
          Course annulée par Turbo
          {info.courseReference ? ` (${info.courseReference})` : ""}
        </p>
        <p className="mt-0.5 text-red-700/90">
          Raison : <span className="font-semibold">{info.reason}</span>
        </p>
        <p className="mt-1 text-red-600/80">
          La commande reste active. Relancez une livraison depuis la page
          Courses, ou annulez la commande manuellement.
        </p>
      </div>
    </div>
  );
}
