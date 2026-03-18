"use client";

import React, { useState, useEffect } from "react";
import { useSettingsQuery, useSettingMutation } from "@/hooks/useSettingsQuery";
import { CheckCircle, CreditCard } from "lucide-react";

const KKIAPAY_KEYS = [
  { key: "kkiapay_public_key", label: "Clé publique", placeholder: "9a5c6b33..." },
  { key: "kkiapay_private_key", label: "Clé privée", placeholder: "pk_...", type: "password" },
  { key: "kkiapay_secret_key", label: "Clé secrète", placeholder: "sk_...", type: "password" },
  { key: "kkiapay_webhook_secret", label: "Webhook Secret", placeholder: "chicken-nation-apps@2025", type: "password" },
  { key: "kkiapay_webhook_path", label: "Webhook URL", placeholder: "https://chicken.turbodeliveryapp.com/api/v1/kkiapay/webhook" },
];

const PaymentSettings: React.FC = () => {
  const { data: settings, isLoading: l1 } = useSettingsQuery("kkiapay_");
  const { mutate: updateSetting, isPending } = useSettingMutation();
  const [values, setValues] = useState<Record<string, string>>({});
  const [sandbox, setSandbox] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const map: Record<string, string> = {};
    for (const s of settings ?? []) map[s.key] = s.value;
    setValues(map);
    if (map["kkiapay_sandbox"] !== undefined) {
      setSandbox(map["kkiapay_sandbox"] === "true");
    }
  }, [settings]);

  const handleSave = () => {
    const allFields = [
      ...KKIAPAY_KEYS,
      { key: "kkiapay_sandbox", label: "Mode Sandbox" },
    ];
    let count = allFields.length;
    for (const field of allFields) {
      const value = field.key === "kkiapay_sandbox"
        ? String(sandbox)
        : values[field.key];
      if (value !== undefined) {
        updateSetting(
          { key: field.key, value, description: `KKiaPay — ${field.label}` },
          {
            onSuccess: () => {
              count--;
              if (count <= 0) {
                setSaved(true);
                setTimeout(() => setSaved(false), 2000);
              }
            },
          }
        );
      } else {
        count--;
      }
    }
  };

  if (l1) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#F17922]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-1">
          <CreditCard size={20} className="text-[#F17922]" />
          <h3 className="text-lg font-bold text-gray-900">Configuration KKiaPay</h3>
        </div>
        <p className="text-sm text-gray-500 mb-6">Clés API et configuration du paiement mobile</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {KKIAPAY_KEYS.map((field) => (
            <div key={field.key} className={field.key === "kkiapay_webhook_path" ? "md:col-span-2" : ""}>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {field.label}
              </label>
              <input
                type={field.type || "text"}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all font-mono"
                placeholder={field.placeholder}
                value={values[field.key] ?? ""}
                onChange={(e) => setValues({ ...values, [field.key]: e.target.value })}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Sandbox toggle */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Mode Sandbox</h3>
            <p className="text-sm text-gray-500 mt-1">
              Active le mode test pour les paiements (aucune transaction réelle)
            </p>
          </div>
          <button
            onClick={() => setSandbox(!sandbox)}
            className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
              sandbox ? "bg-[#F17922]" : "bg-gray-300"
            }`}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform ${
                sandbox ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>
      </div>

      <div className="flex justify-end items-center gap-3">
        {saved && (
          <span className="flex items-center gap-1.5 text-green-600 text-sm font-medium">
            <CheckCircle size={16} /> Enregistré
          </span>
        )}
        <button
          onClick={handleSave}
          disabled={isPending}
          className="px-6 py-2.5 bg-[#F17922] text-white font-semibold rounded-xl hover:bg-[#e06816] transition-all disabled:opacity-50"
        >
          {isPending ? "Enregistrement..." : "Enregistrer"}
        </button>
      </div>
    </div>
  );
};

export default PaymentSettings;
