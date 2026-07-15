"use client";

import React, { useState } from "react";
import { Calculator, Loader2 } from "lucide-react";
import { useScratchSimulateQuery } from "../queries/scratch.queries";
import { ScratchLevel } from "../types/scratch.types";
import {
  money,
  probaFmt,
  REWARD_TYPE_BADGE,
  REWARD_TYPE_LABEL,
} from "../utils/scratch.utils";

const inputCls =
  "w-full h-11 rounded-lg border border-[#E4E4E7] px-3 text-sm text-[#18181B] focus:outline-none focus:ring-2 focus:ring-[#F17922]/30";

const LEVELS: { key: ScratchLevel | ""; label: string }[] = [
  { key: "", label: "Tous niveaux" },
  { key: "STANDARD", label: "Standard" },
  { key: "VIP", label: "VIP" },
  { key: "VVIP", label: "VVIP" },
];

const KpiCard: React.FC<{
  label: string;
  value: React.ReactNode;
  sub?: string;
  accent?: string;
}> = ({ label, value, sub, accent = "#18181B" }) => (
  <div className="rounded-xl border border-[#E4E4E7] bg-white px-4 py-3">
    <div className="text-[11px] uppercase tracking-wide text-[#9796A1]">
      {label}
    </div>
    <div className="text-xl font-bold mt-0.5" style={{ color: accent }}>
      {value}
    </div>
    {sub && <div className="text-[11px] text-[#9796A1] mt-0.5">{sub}</div>}
  </div>
);

export default function ScratchSimulator() {
  const [amountInput, setAmountInput] = useState("5000");
  const [level, setLevel] = useState<ScratchLevel | "">("");
  const [submitted, setSubmitted] = useState<{
    amount: number;
    level?: ScratchLevel;
  } | null>({ amount: 5000 });

  const query = useScratchSimulateQuery(
    {
      amount: submitted?.amount ?? 0,
      level: submitted?.level,
    },
    !!submitted
  );
  const sim = query.data;

  const run = () => {
    const a = Number(amountInput);
    if (!(a > 0)) return;
    setSubmitted({ amount: a, level: level === "" ? undefined : level });
  };

  return (
    <div className="space-y-6">
      {/* Saisie */}
      <div className="bg-white rounded-2xl border border-[#E4E4E7] p-5 sm:p-6">
        <h2 className="text-[18px] font-semibold text-[#F17922] mb-4 flex items-center gap-2">
          <Calculator size={18} /> Simulateur de tirage
        </h2>
        <p className="text-sm text-[#71717A] mb-4">
          Estimez le surcoût et la distribution des probabilités pour un panier
          donné, afin de calibrer les lots avant activation.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-3 items-end">
          <div>
            <label className="block text-sm font-medium text-[#71717A] mb-1.5">
              Montant du panier (FCFA)
            </label>
            <input
              type="number"
              min={1}
              className={inputCls}
              value={amountInput}
              onChange={(e) => setAmountInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && run()}
              placeholder="Ex. 5000"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#71717A] mb-1.5">
              Niveau client (optionnel)
            </label>
            <select
              className={inputCls}
              value={level}
              onChange={(e) => setLevel(e.target.value as ScratchLevel | "")}
            >
              {LEVELS.map((l) => (
                <option key={l.key} value={l.key}>
                  {l.label}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            onClick={run}
            disabled={query.isFetching}
            className="h-11 px-6 rounded-lg bg-[#F17922] text-white font-semibold hover:bg-[#e06816] disabled:opacity-60 cursor-pointer flex items-center justify-center gap-2"
          >
            {query.isFetching ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              "Simuler"
            )}
          </button>
        </div>
      </div>

      {/* Résultats */}
      {sim && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard label="Panier simulé" value={money(sim.amount)} />
            <KpiCard
              label="Coût cible"
              value={money(sim.target_cost)}
              sub="Budget alloué à ce panier"
              accent="#2B6CB0"
            />
            <KpiCard
              label="Coût moyen réalisé"
              value={money(sim.realized_avg_cost)}
              sub="Attendu avec la config actuelle"
              accent="#1E8E5A"
            />
            <KpiCard
              label="Espérance de surcoût"
              value={money(sim.expected_cost)}
              sub={`Plancher : ${probaFmt(sim.floor.probability)}`}
              accent="#F17922"
            />
          </div>

          {/* Distribution des probabilités effectives */}
          <div className="bg-white rounded-2xl border border-[#E4E4E7] p-5 sm:p-6">
            <h3 className="text-base font-semibold text-[#595959] mb-4">
              Distribution des probabilités effectives
            </h3>
            <div className="space-y-3">
              {sim.lots.map((lot) => {
                const p = lot.probability || 0;
                return (
                  <div key={lot.id} className="space-y-1">
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-medium text-[#18181B] truncate">
                          {lot.label}
                        </span>
                        <span
                          className={`shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                            REWARD_TYPE_BADGE[lot.reward_type]
                          }`}
                        >
                          {REWARD_TYPE_LABEL[lot.reward_type]}
                        </span>
                        {!lot.eligible && (
                          <span
                            className="shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#FDECEA] text-[#C0392B]"
                            title={lot.reason}
                          >
                            inéligible
                          </span>
                        )}
                      </div>
                      <div className="shrink-0 text-right">
                        <span className="font-bold text-[#18181B]">
                          {probaFmt(p)}
                        </span>
                        <span className="text-[11px] text-[#9796A1]">
                          {" "}
                          · poids {lot.effective_weight}
                        </span>
                      </div>
                    </div>
                    <div className="h-2.5 w-full rounded-full bg-[#F1F3F5] overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          lot.eligible ? "bg-[#F17922]" : "bg-[#D9D9D9]"
                        }`}
                        style={{
                          width: `${Math.min(100, p * 100).toFixed(2)}%`,
                        }}
                      />
                    </div>
                    {!lot.eligible && lot.reason && (
                      <div className="text-[11px] text-[#C0392B]">
                        {lot.reason}
                      </div>
                    )}
                  </div>
                );
              })}
              {sim.lots.length === 0 && (
                <div className="text-sm text-[#9796A1]">
                  Aucun lot éligible pour ce scénario.
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {query.isError && (
        <div className="rounded-lg bg-[#FDECEA] text-[#C0392B] text-sm px-4 py-3">
          {query.error instanceof Error
            ? query.error.message
            : "Erreur lors de la simulation"}
        </div>
      )}
    </div>
  );
}
