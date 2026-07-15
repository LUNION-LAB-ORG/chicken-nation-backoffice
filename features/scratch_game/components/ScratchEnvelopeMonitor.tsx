"use client";

import React from "react";
import { Activity, CheckCircle2, AlertTriangle, RefreshCw } from "lucide-react";
import { useScratchEnvelopeQuery } from "../queries/scratch.queries";
import { money, pctFmt } from "../utils/scratch.utils";

const StatCard: React.FC<{
  label: string;
  value: React.ReactNode;
  sub?: string;
}> = ({ label, value, sub }) => (
  <div className="rounded-xl border border-[#E4E4E7] bg-white px-4 py-3">
    <div className="text-[11px] uppercase tracking-wide text-[#9796A1]">
      {label}
    </div>
    <div className="text-xl font-bold text-[#18181B] mt-0.5">{value}</div>
    {sub && <div className="text-[11px] text-[#9796A1] mt-0.5">{sub}</div>}
  </div>
);

export default function ScratchEnvelopeMonitor() {
  const { data: env, isLoading, isFetching, refetch, isError, error } =
    useScratchEnvelopeQuery();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-12 h-12 border-4 border-[#F17922] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-lg bg-[#FDECEA] text-[#C0392B] text-sm px-4 py-3">
        {error instanceof Error
          ? error.message
          : "Erreur de chargement de l'enveloppe"}
      </div>
    );
  }

  if (!env) return null;

  const within = env.within_target;
  const ratio =
    env.envelope_pct_target > 0
      ? Math.min(150, (env.realized_pct / env.envelope_pct_target) * 100)
      : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-[18px] font-semibold text-[#F17922] flex items-center gap-2">
          <Activity size={18} /> Moniteur d&apos;enveloppe
        </h2>
        <button
          type="button"
          onClick={() => refetch()}
          disabled={isFetching}
          className="inline-flex items-center gap-1.5 text-sm text-[#71717A] hover:text-[#F17922] cursor-pointer disabled:opacity-60"
        >
          <RefreshCw
            size={14}
            className={isFetching ? "animate-spin" : ""}
          />
          Actualiser
        </button>
      </div>

      {/* Bandeau cible vs réalisé */}
      <div
        className={`rounded-2xl border p-5 sm:p-6 ${
          within
            ? "border-[#B7E4C7] bg-[#F4FAF6]"
            : "border-[#F5C6C0] bg-[#FDF4F3]"
        }`}
      >
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2">
              {within ? (
                <CheckCircle2 size={20} className="text-[#1E8E5A]" />
              ) : (
                <AlertTriangle size={20} className="text-[#C0392B]" />
              )}
              <span
                className={`text-sm font-bold ${
                  within ? "text-[#1E8E5A]" : "text-[#C0392B]"
                }`}
              >
                {within ? "Dans la cible" : "Hors cible"}
              </span>
            </div>
            <div className="mt-2 flex items-end gap-3">
              <div className="text-3xl font-bold text-[#18181B]">
                {pctFmt(env.realized_pct)}
              </div>
              <div className="text-sm text-[#71717A] mb-1">
                réalisé / cible {pctFmt(env.envelope_pct_target)}
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-[11px] uppercase tracking-wide text-[#9796A1]">
              Fenêtre d&apos;analyse
            </div>
            <div className="text-lg font-semibold text-[#18181B]">
              {env.window_days} jours
            </div>
          </div>
        </div>

        {/* Jauge */}
        <div className="mt-4">
          <div className="h-3 w-full rounded-full bg-white border border-[#E4E4E7] overflow-hidden relative">
            <div
              className={`h-full rounded-full ${
                within ? "bg-[#1E8E5A]" : "bg-[#C0392B]"
              }`}
              style={{ width: `${(ratio / 1.5).toFixed(1)}%` }}
            />
            {/* Repère 100% = cible */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-[#18181B]/40"
              style={{ left: `${Math.min(100, 100 * (100 / 150)).toFixed(1)}%` }}
              title="Cible"
            />
          </div>
          <div className="flex justify-between text-[10px] text-[#9796A1] mt-1">
            <span>0 %</span>
            <span>Cible</span>
            <span>+50 %</span>
          </div>
        </div>
      </div>

      {/* Détails */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          label="Tirages"
          value={env.draws.toLocaleString("fr-FR")}
          sub={`dont ${env.gros_lot_draws.toLocaleString("fr-FR")} gros lots`}
        />
        <StatCard label="Coût total" value={money(env.total_cost)} />
        <StatCard
          label="Coût moyen réalisé"
          value={money(env.realized_avg_cost)}
          sub="par tirage"
        />
        <StatCard label="Panier moyen" value={money(env.avg_basket)} />
        <StatCard
          label="% réalisé"
          value={pctFmt(env.realized_pct)}
          sub={`cible ${pctFmt(env.envelope_pct_target)}`}
        />
        <StatCard
          label="Gros lots"
          value={env.gros_lot_draws.toLocaleString("fr-FR")}
          sub="sur la fenêtre"
        />
      </div>
    </div>
  );
}
