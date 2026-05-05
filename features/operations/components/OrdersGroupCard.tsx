"use client";

import React from "react";
import { Package } from "lucide-react";

import type { Order } from "../../orders/types/order.types";
import type { IOrderGroup } from "../types/operations.types";
import { OperationsCard } from "./OperationsCard";

interface Props {
  group: IOrderGroup;
  onCardClick: (order: Order) => void;
  onPayClick?: (order: Order) => void;
}

/**
 * Container d'un regroupement de commandes d'une même course CHICKEN_NATION.
 * Code retrait XXL bien visible pour la caissière, cards internes sans ring d'urgence
 * (le groupe mutualise l'état).
 */
export const OrdersGroupCard: React.FC<Props> = ({ group, onCardClick, onPayClick }) => {
  const isGrouped = group.courseId !== null && group.orders.length > 1;

  if (!isGrouped) {
    return (
      <>
        {group.orders.map((o) => (
          <OperationsCard
            key={o.id}
            order={o}
            onClick={() => onCardClick(o)}
            onPayClick={onPayClick ? () => onPayClick(o) : undefined}
          />
        ))}
      </>
    );
  }

  return (
    <div className="rounded-3xl border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50/40 p-3 space-y-2 shadow-sm">
      {/* Hero : badge course + code retrait XXL */}
      <div className="flex items-center justify-between gap-3 px-2 py-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-9 h-9 rounded-full bg-[#F17922] flex items-center justify-center shrink-0">
            <Package className="w-4 h-4 text-white" />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] uppercase tracking-wider font-bold text-[#F17922]">
              Course groupée
            </div>
            <div className="text-sm font-bold text-gray-900 truncate">{group.courseReference}</div>
            <div className="text-[11px] text-gray-600">
              {group.orders.length} commandes à récupérer
            </div>
          </div>
        </div>

        {group.pickupCode && (
          <div className="bg-white border-2 border-[#F17922] rounded-xl px-3 py-1.5 shadow-md text-center shrink-0">
            <div className="text-[9px] uppercase font-semibold text-gray-500 tracking-wider">
              Code
            </div>
            <div className="font-mono text-2xl font-bold text-[#F17922] leading-none">
              {group.pickupCode}
            </div>
          </div>
        )}
      </div>

      {/* Cards des commandes du groupe */}
      <div className="space-y-2">
        {group.orders.map((o) => (
          <OperationsCard
            key={o.id}
            order={o}
            onClick={() => onCardClick(o)}
            onPayClick={onPayClick ? () => onPayClick(o) : undefined}
            hideUrgencyRing
          />
        ))}
      </div>
    </div>
  );
};
