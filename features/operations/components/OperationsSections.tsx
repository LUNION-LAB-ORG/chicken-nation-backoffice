"use client";

import React, { useMemo } from "react";
import { AlertTriangle, ChefHat, PackageCheck, Store, Truck } from "lucide-react";

import type { Order } from "../../orders/types/order.types";
import type { IOperationsBuckets, IOrderGroup } from "../types/operations.types";
import { isOrderLate } from "../utils/group-orders";
import { OperationsCard } from "./OperationsCard";
import { OrdersGroupCard } from "./OrdersGroupCard";

interface Props {
  buckets: IOperationsBuckets;
  onCardClick: (order: Order) => void;
  /** Clic sur « Faire le paiement » en bas d'une card — ouvre le drawer sur le tab Paiement */
  onPayClick: (order: Order) => void;
}

/**
 * Vue **Kanban** des commandes en cours — 2 colonnes visibles simultanément,
 * pas de filtrage / pas d'onglets :
 *
 *   ┌─────────────────────────┐  ┌─────────────────────────┐
 *   │ 🍳 Au restaurant        │  │ 🚚 Hors restaurant      │
 *   │   ┌─ À préparer ───┐    │  │  • En livraison         │
 *   │   │   …cards…      │    │  │  • Récupérée client     │
 *   │   └────────────────┘    │  │   …cards…               │
 *   │   ┌─ Prêtes ───────┐    │  │                         │
 *   │   │   …cards…      │    │  │                         │
 *   │   └────────────────┘    │  │                         │
 *   └─────────────────────────┘  └─────────────────────────┘
 *
 * Pour chaque colonne :
 *   - Compteur total (pastille claire)
 *   - Badge rouge ⚠ N s'il y a des retards (READY > 30 min, COLLECTED non
 *     payée > seuil) — `isOrderLate()` matérialise aussi un anneau rouge sur
 *     chaque carte concernée.
 *
 * Ordre dans "Au restaurant" : À préparer d'abord (nouvelles à prendre en
 * charge), puis Prêtes (attendent le livreur avec leur code retrait XXL).
 *
 * Mobile (< lg) : les colonnes s'empilent verticalement.
 */
export const OperationsSections: React.FC<Props> = ({
  buckets,
  onCardClick,
  onPayClick,
}) => {
  const { aPreparer, pretesGroupes, recuperees } = buckets;

  const pretesOrders = useMemo<Order[]>(
    () => pretesGroupes.flatMap((g) => g.orders),
    [pretesGroupes],
  );

  // Compteurs par colonne (orders, pas groupes).
  const auRestaurantCount = aPreparer.length + pretesOrders.length;
  const horsRestaurantCount = recuperees.length;

  // Retards par colonne — pour le badge rouge.
  const lateAuRestaurant =
    aPreparer.filter(isOrderLate).length + pretesOrders.filter(isOrderLate).length;
  const lateHorsRestaurant = recuperees.filter(isOrderLate).length;

  const totalAll = auRestaurantCount + horsRestaurantCount;

  if (totalAll === 0) {
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
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
      {/* ─── Colonne 1 : Au restaurant ────────────────────────────────── */}
      <KanbanColumn
        Icon={Store}
        title="Au restaurant"
        count={auRestaurantCount}
        lateCount={lateAuRestaurant}
        accent="amber"
      >
        {auRestaurantCount === 0 ? (
          <EmptyState message="Aucune commande au restaurant" />
        ) : (
          <div className="space-y-4">
            <SubSection
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
                  showWarningBadge={isOrderLate(o)}
                  warningLabel="En retard"
                />
              ))}
            </SubSection>

            <SubSection
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
            </SubSection>
          </div>
        )}
      </KanbanColumn>

      {/* ─── Colonne 2 : Hors restaurant ──────────────────────────────── */}
      <KanbanColumn
        Icon={Truck}
        title="Hors restaurant"
        count={horsRestaurantCount}
        lateCount={lateHorsRestaurant}
        accent="purple"
      >
        {horsRestaurantCount === 0 ? (
          <EmptyState message="Aucune commande hors restaurant" />
        ) : (
          <div className="space-y-2">
            {recuperees.map((o) => (
              <OperationsCard
                key={o.id}
                order={o}
                onClick={() => onCardClick(o)}
                onPayClick={() => onPayClick(o)}
                showWarningBadge={isOrderLate(o)}
                warningLabel="En retard"
              />
            ))}
          </div>
        )}
      </KanbanColumn>
    </div>
  );
};

// ============================================================================
// Helpers UI
// ============================================================================

type Accent = "amber" | "purple";

const ACCENT_HEADER: Record<Accent, string> = {
  amber: "bg-gradient-to-r from-amber-50 to-amber-100/50 border-amber-200",
  purple: "bg-gradient-to-r from-purple-50 to-purple-100/50 border-purple-200",
};
const ACCENT_ICON: Record<Accent, string> = {
  amber: "bg-amber-500 text-white",
  purple: "bg-purple-600 text-white",
};
const ACCENT_COUNT: Record<Accent, string> = {
  amber: "bg-white text-amber-700 border-amber-200",
  purple: "bg-white text-purple-700 border-purple-200",
};

function KanbanColumn({
  Icon,
  title,
  count,
  lateCount,
  accent,
  children,
}: {
  Icon: React.ComponentType<{ className?: string }>;
  title: string;
  count: number;
  lateCount: number;
  accent: Accent;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      {/* En-tête de colonne — toujours visible (sticky pour suivre le scroll vertical interne) */}
      <header
        className={`flex items-center justify-between px-4 py-3 border-b ${ACCENT_HEADER[accent]}`}
      >
        <div className="flex items-center gap-2.5">
          <div
            className={`h-8 w-8 rounded-lg flex items-center justify-center ${ACCENT_ICON[accent]}`}
          >
            <Icon className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-bold text-gray-900">{title}</h3>
          {/* Compteur total (pastille claire) */}
          <span
            className={`min-w-[24px] h-6 px-2 inline-flex items-center justify-center rounded-full text-xs font-bold border ${ACCENT_COUNT[accent]}`}
          >
            {count}
          </span>
        </div>

        {/* Badge rouge ⚠ N — uniquement si retards */}
        {lateCount > 0 && (
          <span
            title={`${lateCount} commande${lateCount > 1 ? "s" : ""} en retard`}
            className="inline-flex items-center gap-1 px-2 h-6 rounded-full text-[11px] font-bold bg-red-600 text-white animate-pulse"
          >
            <AlertTriangle className="w-3 h-3" />
            {lateCount}
          </span>
        )}
      </header>

      {/* Contenu de la colonne */}
      <div className="p-3">{children}</div>
    </section>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 py-10 text-center">
      <PackageCheck className="w-8 h-8 text-gray-300 mx-auto mb-2" />
      <p className="text-sm text-gray-500">{message}</p>
    </div>
  );
}

function SubSection({
  title,
  icon,
  count,
  tone,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  count: number;
  tone: "amber" | "green";
  children: React.ReactNode;
}) {
  const toneBg =
    tone === "amber" ? "bg-amber-50 border-amber-200" : "bg-green-50 border-green-200";
  const hasContent = React.Children.count(children) > 0;
  return (
    <div className={`rounded-xl border ${toneBg} p-3`}>
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          {icon}
          <h4 className="text-sm font-bold text-gray-900">{title}</h4>
        </div>
        <span className="text-xs font-medium text-gray-500 bg-white rounded-full px-2 py-0.5 border border-gray-200">
          {count}
        </span>
      </div>
      {hasContent ? (
        <div className="space-y-2">{children}</div>
      ) : (
        <p className="text-xs text-gray-400 text-center py-6">Aucune commande</p>
      )}
    </div>
  );
}
