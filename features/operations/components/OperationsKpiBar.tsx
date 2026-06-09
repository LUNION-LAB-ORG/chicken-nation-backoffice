"use client";

import React from "react";
import { AlertTriangle, ChefHat, PackageCheck, Truck } from "lucide-react";

import type { IOperationsBuckets } from "../types/operations.types";
import { isOrderLate } from "../utils/group-orders";

interface Props {
  buckets: IOperationsBuckets;
  inDeliveryCount: number;
}

/**
 * Barre de 4 compteurs live pour la page Opérations.
 * Animée subtilement au changement (scale pulse via CSS).
 *
 * "Retards" agrège toutes les commandes en retard (READY > 30 min, COLLECTED
 * non payée > seuil), peu importe leur onglet d'origine — c'est l'unique
 * indicateur d'urgence depuis la fusion des 4 sections en 2 onglets.
 */
export function OperationsKpiBar({ buckets, inDeliveryCount }: Props) {
  const pretesTotal = buckets.pretesGroupes.reduce((s, g) => s + g.orders.length, 0);
  const pretesOrders = buckets.pretesGroupes.flatMap((g) => g.orders);
  const lateCount =
    buckets.aPreparer.filter(isOrderLate).length +
    pretesOrders.filter(isOrderLate).length +
    buckets.recuperees.filter(isOrderLate).length;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <KpiTile
        label="À préparer"
        value={buckets.aPreparer.length}
        icon={ChefHat}
        color="#F5A524"
        bgFrom="from-amber-50"
      />
      <KpiTile
        label="Prêtes"
        value={pretesTotal}
        icon={PackageCheck}
        color="#4FCB71"
        bgFrom="from-green-50"
      />
      <KpiTile
        label="Retards"
        value={lateCount}
        icon={AlertTriangle}
        color="#EF4444"
        bgFrom="from-red-50"
        urgent={lateCount > 0}
      />
      <KpiTile
        label="En livraison"
        value={inDeliveryCount}
        icon={Truck}
        color="#8B5CF6"
        bgFrom="from-purple-50"
      />
    </div>
  );
}

function KpiTile({
  label,
  value,
  icon: Icon,
  color,
  bgFrom,
  urgent = false,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgFrom: string;
  urgent?: boolean;
}) {
  return (
    <div
      className={`relative bg-gradient-to-br ${bgFrom} to-white border border-gray-100 rounded-2xl shadow-sm p-5 sm:p-4 overflow-hidden`}
    >
      {urgent && (
        <span className="absolute top-2 right-2 flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-60 animate-ping" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
        </span>
      )}
      {/* Mobile : layout vertical (icône au-dessus, gros chiffre) facon widget natif.
          Desktop (sm+) : layout horizontal compact d'origine. */}
      <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
        <div
          className="w-11 h-11 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ backgroundColor: `${color}20` }}
        >
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
        <div>
          <p className="text-[11px] sm:text-xs text-gray-600 uppercase font-semibold tracking-wide">{label}</p>
          <p className="text-3xl sm:text-2xl font-bold text-gray-900 mt-0.5 leading-none">{value}</p>
        </div>
      </div>
    </div>
  );
}
