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

export function ParametresView() {
  const { data, isLoading } = useProspectSettingsQuery();
  const mutation = useUpdateProspectSettingsMutation();
  const [form, setForm] = useState<ProspectSettings | null>(null);

  useEffect(() => {
    if (data) setForm(data);
  }, [data]);

  if (isLoading || !form) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="w-6 h-6 animate-spin text-[#F17922]" />
      </div>
    );
  }

  const upd = (patch: Partial<ProspectSettings>) =>
    setForm((f) => (f ? { ...f, ...patch } : f));

  return (
    <div className="space-y-4 max-w-3xl">
      {/* Règles du coupon */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <h3 className="font-bold text-gray-900 mb-1">Règles du coupon</h3>
        <p className="text-xs text-gray-500 mb-4">
          Appliquées lors de l&apos;envoi d&apos;un coupon par le call center.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className={labelCls}>Validité (jours)</label>
            <input
              type="number"
              min={1}
              value={form.coupon_validity_days}
              onChange={(e) =>
                upd({ coupon_validity_days: Number(e.target.value) })
              }
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Type de réduction</label>
            <select
              value={form.coupon_discount_type}
              onChange={(e) =>
                upd({
                  coupon_discount_type: e.target
                    .value as ProspectSettings["coupon_discount_type"],
                })
              }
              className={inputCls}
            >
              <option value="PERCENTAGE">Pourcentage (%)</option>
              <option value="FIXED_AMOUNT">Montant fixe (FCFA)</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>
              Valeur{" "}
              {form.coupon_discount_type === "PERCENTAGE" ? "(%)" : "(FCFA)"}
            </label>
            <input
              type="number"
              min={0}
              value={form.coupon_discount_value}
              onChange={(e) =>
                upd({ coupon_discount_value: Number(e.target.value) })
              }
              className={inputCls}
            />
          </div>
        </div>
        <div className="mt-3">
          <label className={labelCls}>Lien de l&apos;app ({"{lien_app}"})</label>
          <input
            value={form.app_link}
            onChange={(e) => upd({ app_link: e.target.value })}
            className={inputCls}
          />
        </div>
      </div>

      {/* Modèles de messages */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <h3 className="font-bold text-gray-900 mb-1">Modèles de messages</h3>
        <p className="text-xs text-gray-500 mb-4">
          Variables disponibles : <code>{"{nom}"}</code>{" "}
          <code>{"{code_coupon}"}</code> <code>{"{lien_app}"}</code>{" "}
          <code>{"{validite}"}</code>. Le bon modèle est choisi automatiquement
          selon le rang de l&apos;interaction.
        </p>
        <div className="space-y-3">
          <div>
            <label className={labelCls}>Découverte (1ʳᵉ fois)</label>
            <textarea
              rows={3}
              value={form.msg_decouverte}
              onChange={(e) => upd({ msg_decouverte: e.target.value })}
              className={`${inputCls} resize-y`}
            />
          </div>
          <div>
            <label className={labelCls}>Relance 1</label>
            <textarea
              rows={3}
              value={form.msg_relance_1}
              onChange={(e) => upd({ msg_relance_1: e.target.value })}
              className={`${inputCls} resize-y`}
            />
          </div>
          <div>
            <label className={labelCls}>Relance 2 / Fidélité</label>
            <textarea
              rows={3}
              value={form.msg_relance_2}
              onChange={(e) => upd({ msg_relance_2: e.target.value })}
              className={`${inputCls} resize-y`}
            />
          </div>
        </div>
      </div>

      {/* Scan de commande (OCR / IA) */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <h3 className="font-bold text-gray-900 mb-1">Scan de commande (OCR / IA)</h3>
        <p className="text-xs text-gray-500 mb-4">
          Permet de préremplir la capture en photographiant l&apos;écran Glovo /
          Yango. « OCR simple » fonctionne <b>sans clé</b> (précision limitée,
          pour tester). Une <b>IA</b> donne de bien meilleurs résultats (clé
          requise).
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className={labelCls}>Moteur</label>
            <select
              value={form.scan_engine}
              onChange={(e) =>
                upd({
                  scan_engine: e.target
                    .value as ProspectSettings["scan_engine"],
                })
              }
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
              Clé API{" "}
              {form.scan_engine === "TESSERACT" && (
                <span className="text-gray-400 font-normal">(non requise)</span>
              )}
            </label>
            <input
              type="password"
              value={form.scan_api_key}
              onChange={(e) => upd({ scan_api_key: e.target.value })}
              placeholder={
                form.scan_engine === "TESSERACT" ? "—" : "Collez votre clé API"
              }
              disabled={form.scan_engine === "TESSERACT"}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Modèle (optionnel)</label>
            <input
              value={form.scan_model}
              onChange={(e) => upd({ scan_model: e.target.value })}
              placeholder={
                form.scan_engine === "GEMINI"
                  ? "gemini-1.5-flash"
                  : form.scan_engine === "OPENAI"
                    ? "gpt-4o-mini"
                    : form.scan_engine === "ANTHROPIC"
                      ? "claude-3-5-haiku-latest"
                      : "—"
              }
              disabled={form.scan_engine === "TESSERACT"}
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
