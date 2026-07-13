"use client";

import React, { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Users, Gift, Clock, Loader2, Save } from "lucide-react";
import {
  getReferralStats,
  getReferralConfig,
  updateReferralConfig,
} from "../services/referral.service";

const inputCls =
  "w-full h-11 rounded-lg border border-[#E4E4E7] px-3 text-sm text-[#18181B] focus:outline-none focus:ring-2 focus:ring-[#F17922]/30";

const StatCard: React.FC<{
  icon: React.ElementType;
  label: string;
  value: number;
  color: string;
}> = ({ icon: Icon, label, value, color }) => (
  <div className="flex-1 bg-white border border-[#E4E4E7] rounded-xl p-4">
    <div className="flex items-center gap-2">
      <Icon size={16} style={{ color }} />
      <span className="text-[11px] uppercase tracking-wide text-[#9796A1]">{label}</span>
    </div>
    <div className="text-2xl font-bold mt-1.5" style={{ color }}>
      {value}
    </div>
  </div>
);

const Label: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <label className="block text-sm font-medium text-[#71717A] mb-1.5">{children}</label>
);

export default function ReferralPanel() {
  const qc = useQueryClient();

  const statsQuery = useQuery({ queryKey: ["referral-stats"], queryFn: getReferralStats });
  const configQuery = useQuery({ queryKey: ["referral-config"], queryFn: getReferralConfig });

  const [welcome, setWelcome] = useState("");
  const [parrainAmount, setParrainAmount] = useState("");

  // Initialise le formulaire depuis la config chargée (bon parrain = VOUCHER v1).
  useEffect(() => {
    const cfg = configQuery.data;
    if (!cfg) return;
    setWelcome(String(cfg.welcome_amount ?? ""));
    const amount =
      cfg.parrain?.type === "VOUCHER" ? Number(cfg.parrain.payload?.amount ?? 0) : 0;
    setParrainAmount(amount ? String(amount) : "");
  }, [configQuery.data]);

  const saveMut = useMutation({
    mutationFn: updateReferralConfig,
    onSuccess: () => {
      toast.success("Configuration du parrainage enregistrée");
      qc.invalidateQueries({ queryKey: ["referral-config"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const stats = statsQuery.data;
  const advancedType =
    configQuery.data?.parrain?.type && configQuery.data.parrain.type !== "VOUCHER"
      ? configQuery.data.parrain.type
      : null;

  const save = () => {
    const w = Number(welcome);
    const p = Number(parrainAmount);
    if (!(w > 0)) return toast.error("Montant du bon de bienvenue invalide.");
    if (!(p > 0)) return toast.error("Montant du bon parrain invalide.");
    saveMut.mutate({
      welcome_amount: w,
      parrain: { type: "VOUCHER", payload: { amount: p } },
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      {/* Configuration */}
      <div className="lg:col-span-3 bg-white border border-[#E4E4E7] rounded-xl p-5 sm:p-6">
        <h2 className="text-[18px] font-semibold text-[#F17922] mb-1">Parrainage</h2>
        <p className="text-sm text-[#9796A1] mb-5">
          Le parrain est récompensé quand son filleul paie sa 1ère commande ; le
          filleul reçoit un bon de bienvenue à l&apos;inscription.
        </p>

        {configQuery.isLoading ? (
          <div className="text-sm text-[#9796A1]">Chargement…</div>
        ) : (
          <div className="space-y-4 max-w-sm">
            <div>
              <Label>Bon de bienvenue du filleul (FCFA)</Label>
              <input
                type="number"
                min={1}
                className={inputCls}
                value={welcome}
                onChange={(e) => setWelcome(e.target.value)}
                placeholder="Ex. 1000"
              />
            </div>
            <div>
              <Label>Bon d&apos;achat du parrain (FCFA)</Label>
              <input
                type="number"
                min={1}
                className={inputCls}
                value={parrainAmount}
                onChange={(e) => setParrainAmount(e.target.value)}
                placeholder="Ex. 2000"
              />
              <p className="text-[11px] text-[#9796A1] mt-1">
                Remis en carte à gratter au parrain (bon créé au grattage).
              </p>
            </div>

            {advancedType && (
              <div className="rounded-lg bg-[#FFF6E9] border border-[#F17922]/20 p-3 text-[11px] text-[#7A3502]">
                La récompense parrain est actuellement configurée en{" "}
                <strong>{advancedType}</strong> (type avancé). Enregistrer ici la
                repassera en bon d&apos;achat.
              </div>
            )}

            <button
              type="button"
              onClick={save}
              disabled={saveMut.isPending}
              className="w-full flex items-center justify-center gap-2 bg-[#F17922] text-white font-semibold py-3 rounded-lg hover:bg-[#e06816] disabled:opacity-60 cursor-pointer"
            >
              {saveMut.isPending ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Save size={18} />
              )}
              Enregistrer
            </button>
          </div>
        )}
      </div>

      {/* Suivi */}
      <div className="lg:col-span-2 space-y-4">
        <h2 className="text-[18px] font-semibold text-[#F17922]">Suivi</h2>
        {statsQuery.isLoading ? (
          <div className="text-sm text-[#9796A1]">Chargement…</div>
        ) : (
          <>
            <StatCard icon={Users} label="Parrainages" value={stats?.total ?? 0} color="#18181B" />
            <StatCard icon={Gift} label="Récompensés" value={stats?.rewarded ?? 0} color="#1E8E5A" />
            <StatCard icon={Clock} label="En attente" value={stats?.pending ?? 0} color="#F17922" />
          </>
        )}
      </div>
    </div>
  );
}
