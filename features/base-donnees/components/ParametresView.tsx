"use client";

import React, { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

import {
  useProspectSettingsQuery,
  useUpdateProspectSettingsMutation,
} from "../queries/prospect-settings.query";
import { ProspectSettings } from "../types/prospect.types";

const labelCls = "block text-xs font-semibold text-gray-700 mb-1.5";
const inputCls =
  "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#F17922]/40";

const MODELE_SUGGERE: Record<ProspectSettings["scan_engine"], string> = {
  TESSERACT: "",
  GEMINI: "gemini-1.5-flash",
  OPENAI: "gpt-4o-mini",
  ANTHROPIC: "claude-3-5-haiku-latest",
};

/**
 * Moteur du scan qui préremplit la capture d'un client Glovo/Yango. La remise
 * du coupon et le message envoyé au client se règlent dans les Réglages du CRM.
 */
export function ParametresView() {
  const { data, isPending, isError, error } = useProspectSettingsQuery();
  const mutation = useUpdateProspectSettingsMutation();
  const [form, setForm] = useState<ProspectSettings | null>(null);

  useEffect(() => {
    if (data) setForm(data);
  }, [data]);

  if (isError) {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
        {(error as Error)?.message || "Impossible de charger les réglages du scan."}
      </div>
    );
  }
  if (isPending || !form) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="w-6 h-6 animate-spin text-[#F17922]" />
      </div>
    );
  }

  const upd = (patch: Partial<ProspectSettings>) => setForm((f) => (f ? { ...f, ...patch } : f));
  const sansCle = form.scan_engine === "TESSERACT";

  return (
    <div className="space-y-4 max-w-3xl">
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <h3 className="font-bold text-gray-900 mb-1">Scan des commandes Glovo/Yango</h3>
        <p className="text-xs text-gray-500 mb-4">
          Préremplit la capture d&apos;un client en photographiant l&apos;écran Glovo ou Yango. L&apos;« OCR simple » fonctionne
          <b> sans clé</b>, avec une précision limitée ; une <b>IA</b> lit bien mieux, avec une clé. La remise du coupon et le
          message au client se règlent dans les Réglages du CRM.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className={labelCls}>Moteur</label>
            <select
              value={form.scan_engine}
              onChange={(e) => upd({ scan_engine: e.target.value as ProspectSettings["scan_engine"] })}
              className={inputCls}
            >
              <option value="TESSERACT">OCR simple (gratuit, sans clé)</option>
              <option value="GEMINI">Google Gemini (IA)</option>
              <option value="OPENAI">OpenAI (IA)</option>
              <option value="ANTHROPIC">Anthropic Claude (IA)</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>
              Clé API {sansCle && <span className="text-gray-400 font-normal">(non requise)</span>}
            </label>
            <input
              type="password"
              value={form.scan_api_key}
              onChange={(e) => upd({ scan_api_key: e.target.value })}
              placeholder={sansCle ? "" : "Collez votre clé API"}
              disabled={sansCle}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Modèle (facultatif)</label>
            <input
              value={form.scan_model}
              onChange={(e) => upd({ scan_model: e.target.value })}
              placeholder={MODELE_SUGGERE[form.scan_engine]}
              disabled={sansCle}
              className={inputCls}
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => mutation.mutate(form)}
          disabled={mutation.isPending}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#F17922] text-white text-sm font-semibold hover:opacity-90 disabled:opacity-60"
        >
          {mutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
          Enregistrer
        </button>
      </div>
    </div>
  );
}
