"use client";

import React, { useEffect, useState } from "react";
import { Loader2, Save, Users, Gift, Clock } from "lucide-react";
import {
  useReferralConfigQuery,
  useReferralStatsQuery,
  useUpdateReferralConfigMutation,
} from "../queries/referral.queries";
import toast from "react-hot-toast";

const inputCls =
  "w-full h-11 rounded-lg border border-[#E4E4E7] px-3 text-sm text-[#18181B] focus:outline-none focus:ring-2 focus:ring-[#F17922]/30";

const Label: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <label className="block text-sm font-medium text-[#71717A] mb-1.5">{children}</label>
);

const Field: React.FC<{
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  suffix?: string;
  hint?: string;
  min?: number;
}> = ({ label, value, onChange, placeholder, suffix, hint, min = 0 }) => (
  <div>
    <Label>{label}</Label>
    <div className="relative">
      <input
        type="number"
        min={min}
        className={inputCls}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
      {suffix && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-[#9796A1]">
          {suffix}
        </span>
      )}
    </div>
    {hint && <p className="text-[11px] text-[#9796A1] mt-1">{hint}</p>}
  </div>
);

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

export default function ReferralConfigForm() {
  const statsQuery = useReferralStatsQuery();
  const configQuery = useReferralConfigQuery();
  const saveMut = useUpdateReferralConfigMutation();

  const [welcome, setWelcome] = useState("");
  const [parrainAmount, setParrainAmount] = useState("");
  const [prime, setPrime] = useState("");
  const [commissionPct, setCommissionPct] = useState("");
  const [windowDays, setWindowDays] = useState("");
  const [capPerReferee, setCapPerReferee] = useState("");
  const [minBasket, setMinBasket] = useState("");
  const [payoutThreshold, setPayoutThreshold] = useState("");

  useEffect(() => {
    const cfg = configQuery.data;
    if (!cfg) return;
    setWelcome(String(cfg.welcome_amount ?? ""));
    const amount =
      cfg.parrain?.type === "VOUCHER" ? Number(cfg.parrain.payload?.amount ?? 0) : 0;
    setParrainAmount(amount ? String(amount) : "");
    setPrime(cfg.prime_amount != null ? String(cfg.prime_amount) : "");
    setCommissionPct(cfg.commission_pct != null ? String(cfg.commission_pct) : "");
    setWindowDays(
      cfg.commission_window_days != null ? String(cfg.commission_window_days) : ""
    );
    setCapPerReferee(cfg.cap_per_referee != null ? String(cfg.cap_per_referee) : "");
    setMinBasket(
      cfg.min_qualifying_basket != null ? String(cfg.min_qualifying_basket) : ""
    );
    setPayoutThreshold(
      cfg.payout_threshold != null ? String(cfg.payout_threshold) : ""
    );
  }, [configQuery.data]);

  const stats = statsQuery.data;
  const advancedType =
    configQuery.data?.parrain?.type && configQuery.data.parrain.type !== "VOUCHER"
      ? configQuery.data.parrain.type
      : null;

  const save = () => {
    const num = (s: string) => Number(s);
    const w = num(welcome);
    const p = num(parrainAmount);
    if (!(w > 0)) return toast.error("Montant du bon de bienvenue invalide.");
    if (!(p > 0)) return toast.error("Montant du bon parrain invalide.");

    const primeN = num(prime);
    const pctN = num(commissionPct);
    const windowN = num(windowDays);
    const capN = num(capPerReferee);
    const basketN = num(minBasket);
    const thresholdN = num(payoutThreshold);

    if (!(primeN >= 0)) return toast.error("Prime par filleul invalide.");
    if (!(pctN >= 0 && pctN <= 100))
      return toast.error("Taux de commission invalide (0–100).");
    if (!(windowN >= 1)) return toast.error("Fenêtre de commission invalide (≥ 1 jour).");
    if (!(capN >= 0)) return toast.error("Plafond par filleul invalide.");
    if (!(basketN >= 0)) return toast.error("Panier minimum invalide.");
    if (!(thresholdN >= 0)) return toast.error("Seuil de versement invalide.");

    saveMut.mutate({
      welcome_amount: w,
      parrain: { type: "VOUCHER", payload: { amount: p } },
      prime_amount: primeN,
      commission_pct: pctN,
      commission_window_days: windowN,
      cap_per_referee: capN,
      min_qualifying_basket: basketN,
      payout_threshold: thresholdN,
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      <div className="lg:col-span-3 space-y-6">
        {/* Bons filleul / parrain (existant) */}
        <div className="bg-white border border-[#E4E4E7] rounded-xl p-5 sm:p-6">
          <h2 className="text-[18px] font-semibold text-[#F17922] mb-1">
            Parrainage — bons
          </h2>
          <p className="text-sm text-[#9796A1] mb-5">
            Le filleul reçoit un bon de bienvenue à l&apos;inscription ; le parrain
            un bon d&apos;achat (carte à gratter) à la 1ère commande payée.
          </p>
          {configQuery.isLoading ? (
            <div className="text-sm text-[#9796A1]">Chargement…</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field
                label="Bon de bienvenue du filleul"
                value={welcome}
                onChange={setWelcome}
                placeholder="Ex. 1000"
                suffix="FCFA"
              />
              <Field
                label="Bon d'achat du parrain"
                value={parrainAmount}
                onChange={setParrainAmount}
                placeholder="Ex. 2000"
                suffix="FCFA"
                hint="Remis en carte à gratter."
              />
              {advancedType && (
                <div className="sm:col-span-2 rounded-lg bg-[#FFF6E9] border border-[#F17922]/20 p-3 text-[11px] text-[#7A3502]">
                  La récompense parrain est configurée en{" "}
                  <strong>{advancedType}</strong> (type avancé). Enregistrer ici la
                  repassera en bon d&apos;achat.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Programme ambassadeur (monétaire) */}
        <div className="bg-white border border-[#E4E4E7] rounded-xl p-5 sm:p-6">
          <h2 className="text-[18px] font-semibold text-[#F17922] mb-1">
            Programme ambassadeur (rémunération)
          </h2>
          <p className="text-sm text-[#9796A1] mb-5">
            L&apos;ambassadeur touche une <strong>prime fixe</strong> par filleul
            qualifié, puis un <strong>pourcentage</strong> sur chaque commande payée
            de ce filleul pendant la fenêtre de commission. Versement manuel au
            backoffice.
          </p>
          {configQuery.isLoading ? (
            <div className="text-sm text-[#9796A1]">Chargement…</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field
                label="Prime par filleul qualifié"
                value={prime}
                onChange={setPrime}
                placeholder="Ex. 1500"
                suffix="FCFA"
                hint="Versée à la 1ère commande payée du filleul (≥ panier minimum)."
              />
              <Field
                label="Panier minimum qualifiant"
                value={minBasket}
                onChange={setMinBasket}
                placeholder="Ex. 3000"
                suffix="FCFA"
                hint="Montant mini d'une commande pour prime & commission (RG-11)."
              />
              <Field
                label="Taux de commission"
                value={commissionPct}
                onChange={setCommissionPct}
                placeholder="Ex. 5"
                suffix="%"
                hint="Appliqué à chaque commande payée du filleul dans la fenêtre."
              />
              <Field
                label="Fenêtre de commission"
                value={windowDays}
                onChange={setWindowDays}
                placeholder="Ex. 90"
                suffix="jours"
                min={1}
                hint="Durée après la 1ère commande qualifiante du filleul."
              />
              <Field
                label="Plafond total par filleul"
                value={capPerReferee}
                onChange={setCapPerReferee}
                placeholder="Ex. 10000"
                suffix="FCFA"
                hint="Prime + commissions cumulées par filleul (RG-14). 0 = illimité."
              />
              <Field
                label="Seuil de versement"
                value={payoutThreshold}
                onChange={setPayoutThreshold}
                placeholder="Ex. 5000"
                suffix="FCFA"
                hint="Solde payable minimum avant de pouvoir verser."
              />
            </div>
          )}

          <button
            type="button"
            onClick={save}
            disabled={saveMut.isPending || configQuery.isLoading}
            className="mt-6 w-full sm:w-auto flex items-center justify-center gap-2 bg-[#F17922] text-white font-semibold px-6 py-3 rounded-lg hover:bg-[#e06816] disabled:opacity-60 cursor-pointer"
          >
            {saveMut.isPending ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Save size={18} />
            )}
            Enregistrer la configuration
          </button>
        </div>
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
