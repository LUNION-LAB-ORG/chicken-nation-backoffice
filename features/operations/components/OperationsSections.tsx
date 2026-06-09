"use client";

import React, { useMemo } from "react";
import { AlertTriangle, PackageCheck, Store, Truck } from "lucide-react";

import { type Order, OrderStatus } from "../../orders/types/order.types";
import type { IOperationsBuckets } from "../types/operations.types";
import { isOrderLate } from "../utils/group-orders";
import { OperationsCard } from "./OperationsCard";
import { OrdersGroupCard } from "./OrdersGroupCard";

/**
 * Priorité d'affichage des commandes "Au restaurant" :
 *  0. NOUVELLES   (PENDING / ACCEPTED) — l'opérateur doit les prendre en charge
 *  1. EN PRÉPA    (IN_PROGRESS)        — déjà en cuisine
 *  2. PRÊTES      (READY)              — n'apparaît qu'à travers OrdersGroupCard,
 *                                        ajoutées après les Order single-status.
 */
function statusOrder(status: OrderStatus): number {
  if (status === OrderStatus.PENDING || status === OrderStatus.ACCEPTED) return 0;
  if (status === OrderStatus.IN_PROGRESS) return 1;
  return 2;
}

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
 *   │   …cards (triées)…      │  │   …cards…               │
 *   └─────────────────────────┘  └─────────────────────────┘
 *
 * Pour chaque colonne :
 *   - Compteur total (pastille claire)
 *   - Badge rouge ⚠ N s'il y a des retards (READY > 30 min, COLLECTED non
 *     payée > seuil) — `isOrderLate()` matérialise aussi un anneau rouge sur
 *     chaque carte concernée.
 *
 * Ordre interne "Au restaurant" : nouvelles (PENDING/ACCEPTED) → en préparation
 * (IN_PROGRESS) → prêtes (READY, groupées par course). Pas de sous-sections
 * encadrées : chaque card porte son badge de statut, ce qui suffit.
 *
 * Mobile (< lg) : les colonnes s'empilent verticalement.
 * Grand écran (xl+) : les cards à l'intérieur de chaque colonne passent en
 * grille 2 colonnes.
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

  // Tri des commandes "À préparer" : nouvelles (PENDING/ACCEPTED) en premier,
  // puis en préparation (IN_PROGRESS). Tie-break par ancienneté (les plus
  // anciennes d'abord, pour traiter dans l'ordre d'arrivée).
  const sortedAPreparer = useMemo<Order[]>(() => {
    return [...aPreparer].sort((a, b) => {
      const diff = statusOrder(a.status) - statusOrder(b.status);
      if (diff !== 0) return diff;
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    });
  }, [aPreparer]);

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
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch">
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
          // Une SEULE grille, sans encadrés intermédiaires. Ordre déterministe :
          // les nouvelles commandes d'abord (PENDING/ACCEPTED), puis "en
          // préparation" (IN_PROGRESS), puis les groupes "Prêtes" (READY)
          // — chaque card porte son badge de statut, ce qui suffit à se repérer.
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-2">
            {sortedAPreparer.map((o) => (
              <OperationsCard
                key={o.id}
                order={o}
                onClick={() => onCardClick(o)}
                onPayClick={() => onPayClick(o)}
                showWarningBadge={isOrderLate(o)}
                warningLabel="En retard"
              />
            ))}
            {pretesGroupes.map((g) => (
              <OrdersGroupCard
                key={g.key}
                group={g}
                onCardClick={onCardClick}
                onPayClick={onPayClick}
              />
            ))}
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
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-2">
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
    <section className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden flex flex-col h-full">
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

      {/* Contenu de la colonne — flex-1 pour que les 2 colonnes aient la même hauteur */}
      <div className="p-3 flex-1">{children}</div>
    </section>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="h-full min-h-[160px] flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50 py-10 text-center">
      <PackageCheck className="w-8 h-8 text-gray-300 mx-auto mb-2" />
      <p className="text-sm text-gray-500">{message}</p>
    </div>
  );
}

