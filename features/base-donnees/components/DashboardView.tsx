"use client";

import React from "react";
import { Loader2 } from "lucide-react";

import { GenericStatCard } from "@/components/gestion/Dashboard/GenericStatCard";

import { useProspectStatsQuery } from "../queries/prospect-analytics.query";

const f = (n: number) => n.toLocaleString("fr-FR");

export function DashboardView() {
  const { data: s, isLoading } = useProspectStatsQuery();

  if (isLoading || !s) {
    return (
      <div className="flex items-center justify-center h-56">
        <Loader2 className="w-6 h-6 animate-spin text-[#F17922]" />
      </div>
    );
  }

  const funnel: { label: string; value: number }[] = [
    { label: "Coordonnées saisies", value: s.funnel.saisis },
    { label: "Vérifiés (joints)", value: s.funnel.verifies },
    { label: "Coupon envoyé", value: s.funnel.coupon_envoye },
    { label: "Inscrits sur l'app", value: s.funnel.inscrits },
    { label: "Convertis (vente)", value: s.funnel.convertis },
  ];
  const max = Math.max(1, s.funnel.saisis);
  const storeMax = Math.max(1, ...s.by_store.map((x) => x.total));

  return (
    <div className="space-y-6">
      {/* KPIs — répartition plateformes */}
      <div className="grid lg:grid-cols-3 md:grid-cols-2 grid-cols-1 gap-6">
        <GenericStatCard
          badgeText="Total coordonnées"
          badgeColor="#F17922"
          value={f(s.total)}
        />
        <GenericStatCard
          badgeText="Contacts Glovo"
          badgeColor="#4285F4"
          value={f(s.platform.glovo)}
          unit={s.total ? `(${Math.round((s.platform.glovo / s.total) * 100)}%)` : ""}
        />
        <GenericStatCard
          badgeText="Contacts Yango"
          badgeColor="#EA4335"
          value={f(s.platform.yango)}
          unit={s.total ? `(${Math.round((s.platform.yango / s.total) * 100)}%)` : ""}
        />
      </div>

      {/* KPIs — qualification & performance */}
      <div className="grid lg:grid-cols-4 md:grid-cols-2 grid-cols-1 gap-6">
        <GenericStatCard badgeText="Vérifiés" badgeColor="#7C3AED" value={f(s.funnel.verifies)} />
        <GenericStatCard badgeText="Inscrits" badgeColor="#16A34A" value={f(s.funnel.inscrits)} />
        <GenericStatCard badgeText="Taux de conversion" badgeColor="#F17922" value={s.conversion_rate} unit="%" />
        <GenericStatCard badgeText="CA généré" badgeColor="#16A34A" value={f(s.sales.ca)} unit="FCFA" />
      </div>

      <div className="grid lg:grid-cols-2 grid-cols-1 gap-6">
        {/* Entonnoir */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-900">Entonnoir de conversion</h3>
          <p className="text-xs text-gray-500 mb-4">
            Du contact capté à la première vente directe
          </p>
          <div className="space-y-2.5">
            {funnel.map((d) => (
              <div key={d.label} className="flex items-center gap-3">
                <div className="w-32 text-xs font-semibold text-gray-600 flex-none">
                  {d.label}
                </div>
                <div className="flex-1 h-7 bg-gray-100 rounded-lg overflow-hidden">
                  <div
                    className="h-full rounded-lg bg-gradient-to-r from-[#F17922] to-[#F5A623]"
                    style={{ width: `${Math.max(3, (d.value / max) * 100)}%` }}
                  />
                </div>
                <div className="w-10 text-right font-bold text-sm flex-none">
                  {d.value}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Performance par store */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-900">Performance par store</h3>
          <p className="text-xs text-gray-500 mb-4">
            Contacts captés (convertis) · Coupons : {s.coupons.sent} émis ·{" "}
            {s.coupons.used} utilisés
          </p>
          {s.by_store.length === 0 ? (
            <p className="text-sm text-gray-400">Aucune donnée par store.</p>
          ) : (
            <div className="space-y-3">
              {s.by_store.map((st) => (
                <div key={st.restaurant_id}>
                  <div className="flex justify-between text-sm font-semibold mb-1">
                    <span>{st.name}</span>
                    <span>
                      {st.total}{" "}
                      <span className="text-green-600 text-xs font-medium">
                        · {st.converted} conv.
                      </span>
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#F17922] rounded-full"
                      style={{ width: `${(st.total / storeMax) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
