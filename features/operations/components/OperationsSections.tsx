"use client";

import React from "react";
import { AlertTriangle, ChefHat, PackageCheck, Truck } from "lucide-react";

import type { Order } from "../../orders/types/order.types";
import type { IOperationsBuckets } from "../types/operations.types";
import { OperationsCard } from "./OperationsCard";
import { OrdersGroupCard } from "./OrdersGroupCard";

interface Props {
  buckets: IOperationsBuckets;
  onCardClick: (order: Order) => void;
  /** Clic sur le bouton « Faire le paiement » en bas d'une card — ouvre le drawer sur le tab Paiement */
  onPayClick: (order: Order) => void;
}

/**
 * 4 colonnes responsive : À préparer / Prêtes / Collectées / ⚠ Problèmes.
 * Scrollables indépendamment pour ne pas perdre de visibilité quand une section grossit.
 */
export const OperationsSections: React.FC<Props> = ({ buckets, onCardClick, onPayClick }) => {
  const { aPreparer, pretesGroupes, recuperees, problemes } = buckets;
  const hasAny =
    aPreparer.length + pretesGroupes.length + recuperees.length + problemes.length > 0;

  if (!hasAny) {
    return (
      <div className="flex-1 flex items-center justify-center py-16 text-center">
        <div>
          <PackageCheck className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-500">Aucune commande en cours</p>
          <p className="text-xs text-gray-400 mt-1">
            Les commandes acceptées apparaissent ici en temps réel.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
      <Section
        title="À préparer"
        icon={<ChefHat className="w-4 h-4 text-amber-600" />}
        count={aPreparer.length}
        tone="amber"
      >
        {aPreparer.map((o) => (
          <OperationsCard
            key={o.id}
            order={o}
            onClick={() => onCardClick(o)}
            onPayClick={() => onPayClick(o)}
          />
        ))}
      </Section>

      <Section
        title="Prêtes"
        icon={<PackageCheck className="w-4 h-4 text-green-600" />}
        count={pretesGroupes.reduce((s, g) => s + g.orders.length, 0)}
        tone="green"
      >
        {pretesGroupes.map((g) => (
          <OrdersGroupCard
            key={g.key}
            group={g}
            onCardClick={onCardClick}
            onPayClick={onPayClick}
          />
        ))}
      </Section>

      <Section
        title="Collectées"
        icon={<Truck className="w-4 h-4 text-purple-600" />}
        count={recuperees.length}
        tone="purple"
      >
        {recuperees.map((o) => (
          <OperationsCard
            key={o.id}
            order={o}
            onClick={() => onCardClick(o)}
            onPayClick={() => onPayClick(o)}
          />
        ))}
      </Section>

      <Section
        title="⚠ Problèmes"
        icon={<AlertTriangle className="w-4 h-4 text-red-600" />}
        count={problemes.length}
        tone="red"
      >
        {problemes.map((o) => (
          <OperationsCard
            key={o.id}
            order={o}
            onClick={() => onCardClick(o)}
            onPayClick={() => onPayClick(o)}
            // Le warning "En retard" ne concerne que les commandes payées (sinon c'est
            // couvert par le bouton / label de paiement en bas de la card).
            showWarningBadge={o.paied}
            warningLabel="En retard"
          />
        ))}
      </Section>
    </div>
  );
};

function Section({
  title,
  icon,
  count,
  tone,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  count: number;
  tone: "amber" | "green" | "purple" | "red";
  children: React.ReactNode;
}) {
  const toneBg = {
    amber: "bg-amber-50",
    green: "bg-green-50",
    purple: "bg-purple-50",
    red: "bg-red-50",
  }[tone];
  const hasContent = React.Children.count(children) > 0;
  return (
    <div className={`rounded-2xl border border-gray-200 ${toneBg} p-3 min-h-[200px]`}>
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          {icon}
          <h4 className="text-sm font-bold text-gray-900">{title}</h4>
        </div>
        <span className="text-xs font-medium text-gray-500 bg-white rounded-full px-2 py-0.5 border border-gray-200">
          {count}
        </span>
      </div>
      <div className="space-y-2">
        {hasContent ? children : (
          <p className="text-xs text-gray-400 text-center py-6">Aucune commande</p>
        )}
      </div>
    </div>
  );
}
