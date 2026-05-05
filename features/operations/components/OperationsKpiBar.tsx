"use client";

import React from "react";
import { AlertTriangle, ChefHat, PackageCheck, Truck } from "lucide-react";

import type { IOperationsBuckets } from "../types/operations.types";

interface Props {
  buckets: IOperationsBuckets;
  inDeliveryCount: number;
}

/**
 * Barre de 4 compteurs live pour la page Opérations.
 * Animée subtilement au changement (scale pulse via CSS).
 */
export function OperationsKpiBar({ buckets, inDeliveryCount }: Props) {
  const pretesTotal = buckets.pretesGroupes.reduce((s, g) => s + g.orders.length, 0);

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
        label="Problèmes"
        value={buckets.problemes.length}
        icon={AlertTriangle}
        color="#EF4444"
        bgFrom="from-red-50"
        urgent={buckets.problemes.length > 0}
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
      className={`relative bg-gradient-to-br ${bgFrom} to-white border border-gray-100 rounded-2xl shadow-sm p-4 overflow-hidden`}
    >
      {urgent && (
        <span className="absolute top-2 right-2 flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-60 animate-ping" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
        </span>
      )}
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ backgroundColor: `${color}20` }}
        >
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
        <div>
          <p className="text-xs text-gray-600 uppercase font-semibold tracking-wide">{label}</p>
          <p className="text-2xl font-bold text-gray-900 mt-0.5">{value}</p>
        </div>
      </div>
    </div>
  );
}
