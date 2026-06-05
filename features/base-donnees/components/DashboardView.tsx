"use client";

import React from "react";
import { Store, TrendingUp } from "lucide-react";

import StatsCard from "@/components/gestion/Statistiques/shared/StatsCard";
import StatsChartCard from "@/components/gestion/Statistiques/shared/StatsChartCard";
import StatsTable from "@/components/gestion/Statistiques/shared/StatsTable";
import StatsLoadingState from "@/components/gestion/Statistiques/shared/StatsLoadingState";

import { useProspectStatsQuery } from "../queries/prospect-analytics.query";

const f = (n: number) => n.toLocaleString("fr-FR");

export function DashboardView() {
  const { data: s, isLoading } = useProspectStatsQuery();

  if (isLoading || !s) {
    return <StatsLoadingState />;
  }

  const funnel: { label: string; value: number }[] = [
    { label: "Coordonnées saisies", value: s.funnel.saisis },
    { label: "Vérifiés (joints)", value: s.funnel.verifies },
    { label: "Coupon envoyé", value: s.funnel.coupon_envoye },
    { label: "Inscrits sur l'app", value: s.funnel.inscrits },
    { label: "Convertis (vente)", value: s.funnel.convertis },
  ];
  const max = Math.max(1, s.funnel.saisis);

  return (
    <div className="space-y-4">
      {/* KPIs — répartition plateformes */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <StatsCard
          title="Total coordonnées"
          value={f(s.total)}
          subtitle="Glovo + Yango"
          color="orange"
        />
        <StatsCard
          title="Contacts Glovo"
          value={f(s.platform.glovo)}
          subtitle={s.total ? `${Math.round((s.platform.glovo / s.total) * 100)}%` : ""}
          color="blue"
        />
        <StatsCard
          title="Contacts Yango"
          value={f(s.platform.yango)}
          subtitle={s.total ? `${Math.round((s.platform.yango / s.total) * 100)}%` : ""}
          color="red"
        />
      </div>

      {/* KPIs — qualification & performance */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatsCard
          title="Vérifiés"
          value={f(s.funnel.verifies)}
          subtitle="appelés & joints"
          color="purple"
        />
        <StatsCard
          title="Inscrits"
          value={f(s.funnel.inscrits)}
          subtitle="comptes créés"
          color="green"
        />
        <StatsCard
          title="Taux de conversion"
          value={`${s.conversion_rate}%`}
          subtitle="convertis ÷ total"
          color="orange"
        />
        <StatsCard
          title="Ventes générées"
          value={f(s.sales.count)}
          subtitle={`${f(s.sales.ca)} FCFA`}
          color="green"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Entonnoir */}
        <StatsChartCard
          title="Entonnoir de conversion"
          subtitle="Du contact capté à la première vente directe"
          icon={TrendingUp}
        >
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
        </StatsChartCard>

        {/* Performance par store */}
        <StatsChartCard
          title="Performance par store"
          subtitle="Contacts captés / convertis"
          icon={Store}
          rightContent={
            <span className="text-xs text-gray-500">
              Coupons : {s.coupons.sent} émis · {s.coupons.used} utilisés
            </span>
          }
        >
          <StatsTable
            columns={[
              { key: "store", label: "Store" },
              { key: "total", label: "Captés", align: "right" },
              { key: "converted", label: "Convertis", align: "right" },
            ]}
            rows={s.by_store.map((st) => ({
              store: st.name,
              total: f(st.total),
              converted: (
                <span className="text-green-600 font-medium">{st.converted}</span>
              ),
            }))}
            emptyMessage="Aucune donnée par store"
          />
        </StatsChartCard>
      </div>
    </div>
  );
}
