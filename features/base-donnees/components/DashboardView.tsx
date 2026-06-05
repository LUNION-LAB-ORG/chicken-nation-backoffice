"use client";

import React from "react";
import { Loader2 } from "lucide-react";

import { useProspectStatsQuery } from "../queries/prospect-analytics.query";

const f = (n: number) => n.toLocaleString("fr-FR");

function Kpi({
  label,
  value,
  sub,
  hero,
}: {
  label: string;
  value: string | number;
  sub?: string;
  hero?: boolean;
}) {
  return (
    <div
      className={`rounded-xl p-4 border ${
        hero
          ? "bg-gradient-to-br from-[#F17922] to-[#ff9f5a] text-white border-transparent"
          : "bg-white border-gray-200"
      }`}
    >
      <div
        className={`text-xs font-semibold ${hero ? "text-white/85" : "text-gray-500"}`}
      >
        {label}
      </div>
      <div className="text-2xl font-bold mt-1">{value}</div>
      {sub && (
        <div className={`text-xs mt-1 ${hero ? "text-white/80" : "text-gray-400"}`}>
          {sub}
        </div>
      )}
    </div>
  );
}

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
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <Kpi label="Total coordonnées" value={f(s.total)} sub="Glovo + Yango" hero />
        <Kpi
          label="Contacts GLOVO"
          value={f(s.platform.glovo)}
          sub={s.total ? `${Math.round((s.platform.glovo / s.total) * 100)}%` : ""}
        />
        <Kpi
          label="Contacts YANGO"
          value={f(s.platform.yango)}
          sub={s.total ? `${Math.round((s.platform.yango / s.total) * 100)}%` : ""}
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Kpi label="Vérifiés" value={f(s.funnel.verifies)} sub="appelés & joints" />
        <Kpi label="Inscrits" value={f(s.funnel.inscrits)} sub="comptes créés" />
        <Kpi label="Taux de conversion" value={`${s.conversion_rate}%`} sub="convertis ÷ total" />
        <Kpi
          label="Ventes générées"
          value={f(s.sales.count)}
          sub={`${f(s.sales.ca)} FCFA`}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Entonnoir */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h3 className="font-bold text-gray-900 mb-1">Entonnoir de conversion</h3>
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

        {/* Par store */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h3 className="font-bold text-gray-900 mb-1">Performance par store</h3>
          <p className="text-xs text-gray-500 mb-4">Contacts captés (convertis)</p>
          {s.by_store.length === 0 ? (
            <p className="text-sm text-gray-400">Aucune donnée.</p>
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
          <div className="grid grid-cols-3 gap-2 mt-5 pt-4 border-t border-gray-100">
            <div>
              <div className="text-xs text-gray-500">Coupons émis</div>
              <div className="font-bold">{s.coupons.sent}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Utilisés</div>
              <div className="font-bold">{s.coupons.used}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Panier moyen</div>
              <div className="font-bold">{f(s.sales.average)} F</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
