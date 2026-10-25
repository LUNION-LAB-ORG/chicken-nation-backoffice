"use client";

import React from "react";

import type { Order } from "../../orders/types/order.types";
import type { IOrderGroup } from "../types/operations.types";
import type { CommandeOperations } from "../utils/suivi-course";
import { OperationsCard } from "./OperationsCard";
import { BandeauCourse } from "./course/BandeauCourse";

interface Props {
  group: IOrderGroup;
  onCardClick: (order: Order) => void;
  onPayClick?: (order: Order) => void;
  /** Toutes les commandes affichées (état du livreur, livraisons commencées). */
  commandes?: readonly Order[];
  /** Heure courante, relue régulièrement par la page (retenues, départ). */
  maintenant?: Date;
}

/**
 * Commandes prêtes d'une même course. Planificateur v2 : la course naît dès
 * qu'une commande est prête, souvent avec une seule commande. Toute course a
 * donc son en-tête (code de retrait en grand, livreur et son état, retenue),
 * quel que soit son nombre de commandes. Une commande sans course reste une
 * carte seule, comme avant.
 */
export const OrdersGroupCard: React.FC<Props> = ({ group, onCardClick, onPayClick, commandes, maintenant }) => {
  if (group.courseId === null) {
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

  const plusieurs = group.orders.length > 1;

  return (
    <div className="rounded-3xl border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50/40 p-3 space-y-2 shadow-sm">
      <BandeauCourse
        group={group}
        commandes={(commandes ?? group.orders) as unknown as CommandeOperations[]}
        maintenant={maintenant ?? new Date()}
      />

      <div className="space-y-2">
        {group.orders.map((o) => (
          <OperationsCard
            key={o.id}
            order={o}
            onClick={() => onCardClick(o)}
            onPayClick={onPayClick ? () => onPayClick(o) : undefined}
            // Plusieurs commandes : le groupe porte l'état ; une seule, elle garde son minuteur.
            hideUrgencyRing={plusieurs}
          />
        ))}
      </div>
    </div>
  );
};
