"use client";

import React from "react";
import { Inbox, Loader2 } from "lucide-react";

import { GenericStatCard } from "@/components/gestion/Dashboard/GenericStatCard";

import { useProspectSalesQuery } from "../queries/prospect-analytics.query";
import { PLATFORM_META } from "../utils/prospect-ui";

const f = (n: number) => n.toLocaleString("fr-FR");

function fmt(iso?: string | null) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("fr-FR");
  } catch {
    return iso;
  }
}

export function SalesView({ restaurantId }: { restaurantId?: string } = {}) {
  const { data, isLoading } = useProspectSalesQuery(restaurantId);
  const rows = data?.data ?? [];
  const totals = data?.totals;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <GenericStatCard badgeText="Ventes générées" badgeColor="#16A34A" value={totals?.count ?? 0} />
        <GenericStatCard badgeText="CA total" badgeColor="#F17922" value={f(totals?.ca ?? 0)} unit="FCFA" />
        <GenericStatCard badgeText="Panier moyen" badgeColor="#4285F4" value={f(totals?.average ?? 0)} unit="FCFA" />
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="w-6 h-6 animate-spin text-[#F17922]" />
          </div>
        ) : rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-gray-400">
            <Inbox className="w-10 h-10 mb-2" />
            <p className="text-sm">Aucune vente attribuée.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-xs uppercase">
                  <th className="text-left font-semibold px-4 py-3">Date</th>
                  <th className="text-left font-semibold px-4 py-3">Client</th>
                  <th className="text-left font-semibold px-4 py-3">Origine</th>
                  <th className="text-left font-semibold px-4 py-3">Coupon</th>
                  <th className="text-left font-semibold px-4 py-3">Store</th>
                  <th className="text-right font-semibold px-4 py-3">Montant</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-t border-gray-100">
                    <td className="px-4 py-3 text-gray-500 tabular-nums">
                      {fmt(r.date)}
                    </td>
                    <td className="px-4 py-3 font-semibold text-gray-800">
                      {r.name}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${PLATFORM_META[r.platform].className}`}
                      >
                        {PLATFORM_META[r.platform].emoji}{" "}
                        {PLATFORM_META[r.platform].label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 tabular-nums">
                      {r.coupon ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {r.restaurant?.name ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-right font-bold tabular-nums">
                      {f(r.amount)} F
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
