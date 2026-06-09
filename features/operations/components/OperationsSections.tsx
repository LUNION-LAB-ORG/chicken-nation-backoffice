"use client";

import React, { useMemo, useState } from "react";
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

type TabKey = "au_restaurant" | "hors_restaurant";

/**
 * Sections des commandes en cours, refondues en **2 onglets logiques** (par
 * présence physique de la commande) :
 *
 *   ┌─────────────────────┐  ┌─────────────────────┐
 *   │ Au restaurant 🍳    │  │ Hors restaurant 🚚  │
 *   │ • À préparer        │  │ • En livraison      │
 *   │ • Prêtes (par cours)│  │ • Récupérée client  │
 *   └─────────────────────┘  └─────────────────────┘
 *
 * Pour chaque onglet :
 *   - Compteur total (pastille claire)
 *   - Badge rouge ⚠ N s'il y a des retards (READY > 30 min, COLLECTED non
 *     payée > seuil) — `isOrderLate()` matérialise aussi un anneau rouge sur
 *     chaque carte concernée.
 *
 * Ordre dans "Au restaurant" : **À préparer d'abord** (nouvelles à prendre en
 * charge), puis **Prêtes** (attendent le livreur — code retrait XXL).
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

  // Compteurs par onglet (orders, pas groupes — un livreur multi-commande
  // compte autant que ses orders pour l'opérateur).
  const auRestaurantCount = aPreparer.length + pretesOrders.length;
  const horsRestaurantCount = recuperees.length;

  // Retards par onglet — pour le badge rouge.
  const lateAuRestaurant =
    aPreparer.filter(isOrderLate).length + pretesOrders.filter(isOrderLate).length;
  const lateHorsRestaurant = recuperees.filter(isOrderLate).length;

  const totalAll = auRestaurantCount + horsRestaurantCount;

  // Onglet actif : par défaut "Au restaurant" si non vide, sinon "Hors restaurant".
  const [active, setActive] = useState<TabKey>(() =>
    auRestaurantCount > 0 || horsRestaurantCount === 0 ? "au_restaurant" : "hors_restaurant",
  );

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
    <div className="space-y-4">
      {/* Onglets */}
      <div className="flex gap-2 overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
        <TabButton
          isActive={active === "au_restaurant"}
          onClick={() => setActive("au_restaurant")}
          Icon={Store}
          label="Au restaurant"
          count={auRestaurantCount}
          lateCount={lateAuRestaurant}
          activeColor="amber"
        />
        <TabButton
          isActive={active === "hors_restaurant"}
          onClick={() => setActive("hors_restaurant")}
          Icon={Truck}
          label="Hors restaurant"
          count={horsRestaurantCount}
          lateCount={lateHorsRestaurant}
          activeColor="purple"
        />
      </div>

      {/* Contenu de l'onglet actif */}
      {active === "au_restaurant" ? (
        <AuRestaurantPanel
          aPreparer={aPreparer}
          pretesGroupes={pretesGroupes}
          onCardClick={onCardClick}
          onPayClick={onPayClick}
        />
      ) : (
        <HorsRestaurantPanel
          recuperees={recuperees}
          onCardClick={onCardClick}
          onPayClick={onPayClick}
        />
      )}
    </div>
  );
};

// ============================================================================
// Onglet : Au restaurant
// ============================================================================

const AuRestaurantPanel: React.FC<{
  aPreparer: Order[];
  pretesGroupes: IOrderGroup[];
  onCardClick: (order: Order) => void;
  onPayClick: (order: Order) => void;
}> = ({ aPreparer, pretesGroupes, onCardClick, onPayClick }) => {
  if (aPreparer.length === 0 && pretesGroupes.length === 0) {
    return <EmptyState message="Aucune commande au restaurant" />;
  }

  // Ordre intentionnel : À préparer d'abord (les nouvelles à prendre en charge),
  // puis Prêtes (qui attendent le livreur, avec leur code retrait XXL).
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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
  );
};

// ============================================================================
// Onglet : Hors restaurant
// ============================================================================

const HorsRestaurantPanel: React.FC<{
  recuperees: Order[];
  onCardClick: (order: Order) => void;
  onPayClick: (order: Order) => void;
}> = ({ recuperees, onCardClick, onPayClick }) => {
  if (recuperees.length === 0) {
    return <EmptyState message="Aucune commande hors restaurant" />;
  }
  return (
    <div className="rounded-2xl border border-purple-200 bg-purple-50 p-3 space-y-2">
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
  );
};

// ============================================================================
// Helpers UI
// ============================================================================

const TAB_ACTIVE_CLASSES: Record<"amber" | "purple", string> = {
  amber: "bg-amber-500 border-amber-500 text-white shadow-sm",
  purple: "bg-purple-600 border-purple-600 text-white shadow-sm",
};

function TabButton({
  isActive,
  onClick,
  Icon,
  label,
  count,
  lateCount,
  activeColor,
}: {
  isActive: boolean;
  onClick: () => void;
  Icon: React.ComponentType<{ className?: string }>;
  label: string;
  count: number;
  lateCount: number;
  activeColor: "amber" | "purple";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative shrink-0 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border transition-colors ${
        isActive
          ? TAB_ACTIVE_CLASSES[activeColor]
          : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
      }`}
    >
      <Icon className="w-4 h-4" />
      <span>{label}</span>
      {/* Compteur total (pastille claire) */}
      <span
        className={`min-w-[22px] h-5 px-1.5 grid place-items-center rounded-full text-[11px] font-bold ${
          isActive ? "bg-white/25 text-white" : "bg-gray-100 text-gray-700"
        }`}
      >
        {count}
      </span>
      {/* Badge rouge ⚠ N — uniquement si retards */}
      {lateCount > 0 && (
        <span
          title={`${lateCount} commande${lateCount > 1 ? "s" : ""} en retard`}
          className="inline-flex items-center gap-0.5 px-1.5 h-5 rounded-full text-[10px] font-bold bg-red-600 text-white animate-pulse"
        >
          <AlertTriangle className="w-2.5 h-2.5" />
          {lateCount}
        </span>
      )}
    </button>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 py-10 text-center">
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
  const toneBg = tone === "amber" ? "bg-amber-50 border-amber-200" : "bg-green-50 border-green-200";
  const hasContent = React.Children.count(children) > 0;
  return (
    <div className={`rounded-2xl border ${toneBg} p-3 min-h-[200px]`}>
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
          <p className="text-xs text-gray-400 text-center py-8">Aucune commande</p>
        )}
      </div>
    </div>
  );
}
