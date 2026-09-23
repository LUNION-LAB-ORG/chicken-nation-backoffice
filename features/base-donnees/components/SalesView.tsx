"use client";

import React, { useMemo, useState } from "react";
import { Inbox, Loader2 } from "lucide-react";

import { GenericStatCard } from "@/components/gestion/Dashboard/GenericStatCard";

import { useProspectSalesQuery } from "../queries/prospect-analytics.query";
import { ProspectPlatform } from "../types/prospect.types";
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

/** « 2026-06 » → « juin 2026 ». */
function moisLisible(cle: string) {
  const [annee, mois] = cle.split("-").map(Number);
  if (!annee || !mois) return cle;
  return new Date(annee, mois - 1, 1).toLocaleDateString("fr-FR", {
    month: "long",
    year: "numeric",
  });
}

const jour = (d: Date) => {
  // Découpe locale, pas `toISOString` : celle-ci repasse en UTC et peut
  // reculer d'un jour selon l'heure à laquelle on clique.
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const j = `${d.getDate()}`.padStart(2, "0");
  return `${d.getFullYear()}-${m}-${j}`;
};

/**
 * Périodes courantes. L'opération a démarré en juin ; « depuis le début »
 * reste le défaut, c'est le chiffre que tout le monde cite.
 */
function periodes(): { cle: string; label: string; debut: string; fin: string }[] {
  const maintenant = new Date();
  const a = maintenant.getFullYear();
  const m = maintenant.getMonth();
  const premierDuMois = new Date(a, m, 1);
  const premierDuMoisDernier = new Date(a, m - 1, 1);
  const dernierDuMoisDernier = new Date(a, m, 0);
  const ilYA90Jours = new Date(maintenant);
  ilYA90Jours.setDate(ilYA90Jours.getDate() - 90);

  return [
    { cle: "tout", label: "Depuis le début", debut: "", fin: "" },
    {
      cle: "mois",
      label: "Ce mois",
      debut: jour(premierDuMois),
      fin: jour(maintenant),
    },
    {
      cle: "mois-1",
      label: "Mois dernier",
      debut: jour(premierDuMoisDernier),
      fin: jour(dernierDuMoisDernier),
    },
    {
      cle: "90j",
      label: "90 derniers jours",
      debut: jour(ilYA90Jours),
      fin: jour(maintenant),
    },
  ];
}

/**
 * Une ligne de la série mensuelle : le mois, sa barre, son chiffre.
 *
 * La barre est proportionnelle au mois le plus fort, pas à un maximum
 * arbitraire : c'est ce qui fait ressortir d'un coup d'œil la période où
 * l'opération a porté, ce qu'une colonne de nombres ne montre jamais.
 */
function BarreMois({
  mois,
  count,
  ca,
  maximum,
}: {
  mois: string;
  count: number;
  ca: number;
  maximum: number;
}) {
  const part = maximum > 0 ? Math.max(2, Math.round((ca / maximum) * 100)) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="w-28 shrink-0 text-xs capitalize text-gray-500">
        {moisLisible(mois)}
      </span>
      <div className="h-5 flex-1 overflow-hidden rounded-md bg-gray-100">
        <div
          className="h-full rounded-md bg-[#F17922]"
          style={{ width: `${part}%` }}
        />
      </div>
      <span className="w-32 shrink-0 text-right text-xs font-bold tabular-nums text-gray-800">
        {f(ca)} F
      </span>
      <span className="w-20 shrink-0 text-right text-xs tabular-nums text-gray-400">
        {count} vente{count > 1 ? "s" : ""}
      </span>
    </div>
  );
}

export function SalesView({ restaurantId }: { restaurantId?: string } = {}) {
  const [platform, setPlatform] = useState<ProspectPlatform | "">("");
  const [debut, setDebut] = useState("");
  const [fin, setFin] = useState("");

  const lesPeriodes = useMemo(periodes, []);
  const periodeActive =
    lesPeriodes.find((p) => p.debut === debut && p.fin === fin)?.cle ??
    "personnalise";

  const { data, isLoading, isFetching } = useProspectSalesQuery({
    ...(restaurantId ? { restaurantId } : {}),
    ...(platform ? { platform } : {}),
    ...(debut ? { startDate: debut } : {}),
    ...(fin ? { endDate: fin } : {}),
  });

  const rows = data?.data ?? [];
  const totals = data?.totals;
  const parPlateforme = data?.parPlateforme ?? [];
  const parMois = data?.parMois ?? [];
  const maxMois = parMois.reduce((m, x) => Math.max(m, x.ca), 0);
  const caTotal = totals?.ca ?? 0;

  return (
    <div className="space-y-4">
      {/* Filtres */}
      <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-3 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="flex flex-wrap gap-1.5">
          {lesPeriodes.map((p) => (
            <button
              key={p.cle}
              type="button"
              onClick={() => {
                setDebut(p.debut);
                setFin(p.fin);
              }}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                periodeActive === p.cle
                  ? "bg-[#F17922] text-white"
                  : "border border-gray-200 text-gray-600 hover:border-[#F17922]/50"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <input
            type="date"
            value={debut}
            max={fin || undefined}
            onChange={(e) => setDebut(e.target.value)}
            aria-label="Début de la période"
            className="rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs text-gray-700"
          />
          <span className="text-xs text-gray-400">au</span>
          <input
            type="date"
            value={fin}
            min={debut || undefined}
            onChange={(e) => setFin(e.target.value)}
            aria-label="Fin de la période"
            className="rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs text-gray-700"
          />
        </div>

        <select
          value={platform}
          onChange={(e) => setPlatform(e.target.value as ProspectPlatform | "")}
          className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-700 sm:ml-auto"
        >
          <option value="">Glovo et Yango</option>
          <option value="GLOVO">Glovo seulement</option>
          <option value="YANGO">Yango seulement</option>
        </select>

        {isFetching && (
          <Loader2 className="h-4 w-4 animate-spin text-[#F17922]" />
        )}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <GenericStatCard title="Ventes générées" badgeText="Ventes générées" badgeColor="#16A34A" value={totals?.count ?? 0} />
        <GenericStatCard title="CA total" badgeText="CA total" badgeColor="#F17922" value={f(caTotal)} unit="FCFA" />
        <GenericStatCard title="Panier moyen" badgeText="Panier moyen" badgeColor="#4285F4" value={f(totals?.average ?? 0)} unit="FCFA" />
      </div>

      {/*
        Ventilation par plateforme. Affichée même quand un filtre plateforme
        est posé : elle vaut alors confirmation du périmètre lu.
      */}
      {parPlateforme.length > 0 && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {parPlateforme.map((v) => {
            const meta = PLATFORM_META[v.platform];
            const part = caTotal > 0 ? Math.round((v.ca / caTotal) * 100) : 0;
            return (
              <div
                key={v.platform}
                className="rounded-xl border border-gray-200 bg-white p-4"
              >
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold ${meta.className}`}
                  >
                    {meta.emoji} {meta.label}
                  </span>
                  <span className="text-xs tabular-nums text-gray-400">
                    {part} % du CA
                  </span>
                </div>
                <p className="mt-2 text-2xl font-bold tabular-nums text-gray-900">
                  {f(v.ca)}{" "}
                  <span className="text-sm font-semibold text-gray-400">FCFA</span>
                </p>
                <p className="mt-0.5 text-xs tabular-nums text-gray-500">
                  {v.count} vente{v.count > 1 ? "s" : ""} convertie
                  {v.count > 1 ? "s" : ""}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {/* Série mensuelle */}
      {parMois.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="mb-3 text-sm font-semibold text-gray-800">
            Conversions mois par mois
          </p>
          <div className="space-y-2 overflow-x-auto">
            <div className="min-w-[440px] space-y-2">
              {parMois.map((m) => (
                <BarreMois key={m.mois} {...m} maximum={maxMois} />
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        {isLoading ? (
          <div className="flex h-48 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-[#F17922]" />
          </div>
        ) : rows.length === 0 ? (
          <div className="flex h-48 flex-col items-center justify-center text-gray-400">
            <Inbox className="mb-2 h-10 w-10" />
            <p className="text-sm">Aucune vente sur cette période.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-xs uppercase text-gray-500">
                    <th className="px-4 py-3 text-left font-semibold">Date</th>
                    <th className="px-4 py-3 text-left font-semibold">Client</th>
                    <th className="px-4 py-3 text-left font-semibold">Origine</th>
                    <th className="px-4 py-3 text-left font-semibold">Coupon</th>
                    <th className="px-4 py-3 text-left font-semibold">Store</th>
                    <th className="px-4 py-3 text-right font-semibold">Montant</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id} className="border-t border-gray-100">
                      <td className="px-4 py-3 tabular-nums text-gray-500">
                        {fmt(r.date)}
                      </td>
                      <td className="px-4 py-3 font-semibold text-gray-800">
                        {r.name}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold ${PLATFORM_META[r.platform].className}`}
                        >
                          {PLATFORM_META[r.platform].emoji}{" "}
                          {PLATFORM_META[r.platform].label}
                        </span>
                      </td>
                      <td className="px-4 py-3 tabular-nums text-gray-500">
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

            {/*
              Le tableau est borné à 500 lignes, les totaux non. Le dire, sinon
              quelqu'un comptera les lignes et croira le chiffre faux.
            */}
            {rows.length >= 500 && (
              <p className="border-t border-gray-100 px-4 py-2.5 text-xs text-gray-400">
                Les 500 ventes les plus récentes sont listées. Les totaux et les
                ventilations ci-dessus portent sur l&apos;ensemble de la période.
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
