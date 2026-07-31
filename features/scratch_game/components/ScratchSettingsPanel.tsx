"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Loader2, Save, SlidersHorizontal } from "lucide-react";
import {
  useSettingMutation,
  useSettingsQuery,
} from "@/hooks/useSettingsQuery";
import { SCRATCH_SETTING_KEYS } from "../types/scratch.types";

const inputCls =
  "w-full h-11 rounded-lg border border-[#E4E4E7] px-3 text-sm text-[#18181B] focus:outline-none focus:ring-2 focus:ring-[#F17922]/30";

const Field: React.FC<{
  label: string;
  hint?: string;
  children: React.ReactNode;
}> = ({ label, hint, children }) => (
  <div>
    <label className="block text-sm font-medium text-[#71717A] mb-1.5">
      {label}
    </label>
    {children}
    {hint && <p className="text-[11px] text-[#9796A1] mt-1">{hint}</p>}
  </div>
);

export default function ScratchSettingsPanel() {
  const { data: settings, isLoading } = useSettingsQuery("scratch.");
  const mutation = useSettingMutation();

  const current = useMemo(() => {
    const map: Record<string, string> = {};
    (settings ?? []).forEach((s) => {
      map[s.key] = s.value;
    });
    return map;
  }, [settings]);

  const [enabled, setEnabled] = useState(false);
  const [envelopePct, setEnvelopePct] = useState("");
  const [windowDays, setWindowDays] = useState("");
  const [floorWeight, setFloorWeight] = useState("");
  const [lotExpiryDays, setLotExpiryDays] = useState("");
  const [eligibilityWindowDays, setEligibilityWindowDays] = useState("");

  useEffect(() => {
    setEnabled(current[SCRATCH_SETTING_KEYS.enabled] === "true");
    setEnvelopePct(current[SCRATCH_SETTING_KEYS.envelope_pct] ?? "");
    setWindowDays(current[SCRATCH_SETTING_KEYS.window_days] ?? "");
    setFloorWeight(current[SCRATCH_SETTING_KEYS.floor_weight] ?? "");
    setLotExpiryDays(current[SCRATCH_SETTING_KEYS.lot_expiry_days] ?? "");
    setEligibilityWindowDays(current[SCRATCH_SETTING_KEYS.eligibility_window_days] ?? "");
  }, [current]);

  const save = async (key: string, value: string, description?: string) => {
    await mutation.mutateAsync({ key, value, description });
  };

  const handleToggle = async (next: boolean) => {
    setEnabled(next);
    await save(
      SCRATCH_SETTING_KEYS.enabled,
      String(next),
      "Active le moteur Gratte & Gagne"
    );
  };

  const handleSaveNumbers = async () => {
    await save(
      SCRATCH_SETTING_KEYS.envelope_pct,
      envelopePct,
      "Cible d'enveloppe (% du CA)"
    );
    await save(
      SCRATCH_SETTING_KEYS.window_days,
      windowDays,
      "Fenêtre d'analyse (jours)"
    );
    await save(
      SCRATCH_SETTING_KEYS.floor_weight,
      floorWeight,
      "Poids du lot plancher"
    );
    await save(
      SCRATCH_SETTING_KEYS.lot_expiry_days,
      lotExpiryDays,
      "Validité des lots gagnés (jours, 0 = sans expiration)"
    );
    await save(
      SCRATCH_SETTING_KEYS.eligibility_window_days,
      eligibilityWindowDays,
      "Fenêtre de la fidélité requise (jours)"
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-12 h-12 border-4 border-[#F17922] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div className="bg-white rounded-2xl border border-[#E4E4E7] p-5 sm:p-6">
        <h2 className="text-[18px] font-semibold text-[#F17922] mb-1 flex items-center gap-2">
          <SlidersHorizontal size={18} /> Réglages Gratte &amp; Gagne
        </h2>
        <p className="text-sm text-[#71717A] mb-5">
          Paramètres globaux du moteur. L&apos;activation rend le jeu disponible
          côté application cliente.
        </p>

        {/* Toggle enabled */}
        <div className="flex items-center justify-between rounded-xl border border-[#E4E4E7] px-4 py-3.5 mb-6">
          <div>
            <div className="text-sm font-semibold text-[#18181B]">
              Moteur activé
            </div>
            <div className="text-[11px] text-[#9796A1]">
              {enabled
                ? "Les clients peuvent gratter."
                : "Le jeu est désactivé."}
            </div>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={enabled}
            onClick={() => handleToggle(!enabled)}
            disabled={mutation.isPending}
            className={`relative h-7 w-12 rounded-full transition-colors cursor-pointer disabled:opacity-60 ${
              enabled ? "bg-[#F17922]" : "bg-[#D9D9D9]"
            }`}
          >
            <span
              className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform ${
                enabled ? "translate-x-5" : "translate-x-0.5"
              }`}
            />
          </button>
        </div>

        {/* Numeric settings */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Field
            label="Cible d'enveloppe (%)"
            hint="Part du CA allouée aux lots"
          >
            <input
              type="number"
              min={0}
              step="0.1"
              className={inputCls}
              value={envelopePct}
              onChange={(e) => setEnvelopePct(e.target.value)}
              placeholder="Ex. 3"
            />
          </Field>
          <Field label="Fenêtre (jours)" hint="Période d'analyse de l'enveloppe">
            <input
              type="number"
              min={1}
              className={inputCls}
              value={windowDays}
              onChange={(e) => setWindowDays(e.target.value)}
              placeholder="Ex. 30"
            />
          </Field>
          <Field label="Poids du plancher" hint="Poids du lot plancher (points)">
            <input
              type="number"
              min={0}
              className={inputCls}
              value={floorWeight}
              onChange={(e) => setFloorWeight(e.target.value)}
              placeholder="Ex. 100"
            />
          </Field>
          <Field
            label="Validité des lots (jours)"
            hint="Un gain non utilisé expire après ce délai — 0 = sans expiration"
          >
            <input
              type="number"
              min={0}
              className={inputCls}
              value={lotExpiryDays}
              onChange={(e) => setLotExpiryDays(e.target.value)}
              placeholder="Ex. 7"
            />
          </Field>
          <Field
            label="Fenêtre fidélité (jours)"
            hint="Période des critères « commandes min. / CA min. » des lots"
          >
            <input
              type="number"
              min={1}
              className={inputCls}
              value={eligibilityWindowDays}
              onChange={(e) => setEligibilityWindowDays(e.target.value)}
              placeholder="Ex. 90"
            />
          </Field>
        </div>

        <div className="flex justify-end mt-6">
          <button
            type="button"
            onClick={handleSaveNumbers}
            disabled={mutation.isPending}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#F17922] text-white font-semibold hover:bg-[#e06816] disabled:opacity-60 cursor-pointer"
          >
            {mutation.isPending ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Save size={16} />
            )}
            Enregistrer les réglages
          </button>
        </div>
      </div>
    </div>
  );
}
