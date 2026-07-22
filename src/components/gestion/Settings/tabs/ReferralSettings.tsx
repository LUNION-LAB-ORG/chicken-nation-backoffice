"use client";

import React, { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { HandCoins, Users } from "lucide-react";
import { api } from "@/services/api";
import ReferralGiftEditor, { GiftConfig } from "./ReferralGiftEditor";

interface ReferralConfig {
  filleul: GiftConfig;
  parrain: GiftConfig;
  prime_amount: number;
  commission_pct: number;
  commission_window_days: number;
  cap_per_referee: number;
  min_qualifying_basket: number;
  payout_threshold: number;
}

const MONEY_FIELDS: { key: keyof ReferralConfig; label: string; hint: string }[] = [
  { key: "prime_amount", label: "Prime par filleul (FCFA)", hint: "Versée au parrain à la qualification" },
  { key: "commission_pct", label: "Commission (%)", hint: "Sur le CA des commandes du filleul" },
  { key: "commission_window_days", label: "Fenêtre commission (jours)", hint: "Après la qualification" },
  { key: "cap_per_referee", label: "Plafond par filleul (FCFA)", hint: "Prime + commission max" },
  { key: "min_qualifying_basket", label: "Panier minimum (FCFA)", hint: "Pour déclencher la prime" },
  { key: "payout_threshold", label: "Seuil de versement (FCFA)", hint: "Cumul avant paiement" },
];

/**
 * Paramètres → Parrainage. Cadeaux à gratter du filleul (à l'inscription) et du
 * parrain (quand le filleul UTILISE son cadeau sur une commande), fixe ou
 * aléatoire, + volet monétaire de l'ambassadeur.
 */
const ReferralSettings: React.FC = () => {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["referral-admin-config"],
    queryFn: () => api.get<ReferralConfig>("/referral/admin/config"),
    staleTime: 60 * 1000,
  });

  const [config, setConfig] = useState<ReferralConfig | null>(null);
  useEffect(() => {
    if (data) setConfig(data);
  }, [data]);

  const save = useMutation({
    mutationFn: (c: ReferralConfig) =>
      api.put("/referral/admin/config", {
        filleul: c.filleul,
        parrain: c.parrain,
        prime_amount: c.prime_amount,
        commission_pct: c.commission_pct,
        commission_window_days: c.commission_window_days,
        cap_per_referee: c.cap_per_referee,
        min_qualifying_basket: c.min_qualifying_basket,
        payout_threshold: c.payout_threshold,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["referral-admin-config"] });
      toast.success("Configuration du parrainage enregistrée");
    },
    onError: (e: unknown) =>
      toast.error(e instanceof Error ? e.message : "Erreur d'enregistrement"),
  });

  if (isLoading || !config) {
    return <p className="py-6 text-sm text-slate-400">Chargement…</p>;
  }

  return (
    <div className="space-y-5 pt-4">
      <div className="flex items-start gap-3 rounded-2xl bg-orange-50 p-4 text-sm text-slate-700">
        <Users className="mt-0.5 h-4 w-4 shrink-0 text-[#F17922]" />
        <p>
          Le filleul reçoit son cadeau à gratter <b>dès l'inscription</b> avec un code.
          Le parrain reçoit le sien <b>quand le filleul utilise son cadeau sur une
          commande</b>. Les deux sont notifiés par push + carte à gratter.
        </p>
      </div>

      <ReferralGiftEditor
        title="Cadeau du filleul"
        subtitle="Offert à l'inscription avec un code de parrainage."
        value={config.filleul}
        onChange={(filleul) => setConfig({ ...config, filleul })}
      />
      <ReferralGiftEditor
        title="Cadeau du parrain"
        subtitle="Offert quand le filleul utilise son cadeau sur une commande."
        value={config.parrain}
        onChange={(parrain) => setConfig({ ...config, parrain })}
      />

      {/* Volet monétaire (ambassadeur) */}
      <div className="rounded-2xl border border-slate-100 p-5">
        <h4 className="flex items-center gap-2 font-semibold text-slate-800">
          <HandCoins className="h-4 w-4 text-[#F17922]" /> Volet monétaire (ambassadeur)
        </h4>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {MONEY_FIELDS.map((f) => (
            <div key={f.key}>
              <label className="mb-1 block text-xs font-medium text-slate-500">{f.label}</label>
              <input
                type="number"
                min={0}
                value={Number(config[f.key] ?? 0)}
                onChange={(e) =>
                  setConfig({ ...config, [f.key]: Number(e.target.value) } as ReferralConfig)
                }
                className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm"
              />
              <p className="mt-1 text-[11px] text-slate-400">{f.hint}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => save.mutate(config)}
          disabled={save.isPending}
          className="h-11 rounded-xl bg-[#F17922] px-6 font-medium text-white transition-colors hover:bg-[#e06a15] disabled:opacity-50"
        >
          {save.isPending ? "Enregistrement…" : "Enregistrer"}
        </button>
      </div>
    </div>
  );
};

export default ReferralSettings;
