"use client";

import React from "react";
import { Inbox, Loader2 } from "lucide-react";

import { useProspectCouponsQuery } from "../queries/prospect-analytics.query";
import { CouponState } from "../types/prospect.types";
import { PLATFORM_META } from "../utils/prospect-ui";

const STATE_META: Record<CouponState, { label: string; cls: string }> = {
  ACTIVE: { label: "Actif", cls: "bg-amber-100 text-amber-700" },
  USED: { label: "Utilisé", cls: "bg-green-100 text-green-700" },
  EXPIRED: { label: "Expiré", cls: "bg-gray-100 text-gray-500" },
};

function fmt(iso?: string | null) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("fr-FR");
  } catch {
    return iso;
  }
}

export function CouponsView() {
  const { data: rows = [], isLoading } = useProspectCouponsQuery();
  const used = rows.filter((r) => r.state === "USED").length;
  const usageRate = rows.length ? Math.round((used / rows.length) * 100) : 0;

  const Counter = ({ label, value }: { label: string; value: string | number }) => (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <div className="text-xs font-semibold text-gray-500">{label}</div>
      <div className="text-2xl font-bold text-gray-900 mt-1">{value}</div>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <Counter label="Coupons émis" value={rows.length} />
        <Counter label="Utilisés" value={used} />
        <Counter label="Taux d'utilisation" value={`${usageRate}%`} />
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="w-6 h-6 animate-spin text-[#F17922]" />
          </div>
        ) : rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-gray-400">
            <Inbox className="w-10 h-10 mb-2" />
            <p className="text-sm">Aucun coupon émis.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-xs uppercase">
                  <th className="text-left font-semibold px-4 py-3">Code</th>
                  <th className="text-left font-semibold px-4 py-3">Contact</th>
                  <th className="text-left font-semibold px-4 py-3">Plateforme</th>
                  <th className="text-left font-semibold px-4 py-3">Émis le</th>
                  <th className="text-left font-semibold px-4 py-3">Expire le</th>
                  <th className="text-left font-semibold px-4 py-3">Store</th>
                  <th className="text-left font-semibold px-4 py-3">État</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-t border-gray-100">
                    <td className="px-4 py-3 font-bold text-gray-800 tabular-nums">
                      {r.code}
                    </td>
                    <td className="px-4 py-3 text-gray-700">{r.name}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${PLATFORM_META[r.platform].className}`}
                      >
                        {PLATFORM_META[r.platform].emoji}{" "}
                        {PLATFORM_META[r.platform].label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 tabular-nums">
                      {fmt(r.sent_at)}
                    </td>
                    <td className="px-4 py-3 text-gray-500 tabular-nums">
                      {fmt(r.expiration_date)}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {r.restaurant?.name ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${STATE_META[r.state].cls}`}
                      >
                        {STATE_META[r.state].label}
                      </span>
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
