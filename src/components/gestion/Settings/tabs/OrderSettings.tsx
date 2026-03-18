"use client";

import React, { useState, useEffect } from "react";
import { useSettingsQuery, useSettingMutation } from "@/hooks/useSettingsQuery";
import { CheckCircle } from "lucide-react";

const ORDER_KEYS = [
  {
    key: "order_tax_rate",
    label: "Taux de taxe (%)",
    placeholder: "0.01",
    type: "number",
    step: "0.001",
    hint: "Ex: 0.01 = 1%, 0.18 = 18%",
  },
  {
    key: "base_delivery_fee",
    label: "Frais de livraison de base (FCFA)",
    placeholder: "2000",
    type: "number",
    step: "100",
    hint: "Montant minimum de frais de livraison",
  },
];

const OrderSettings: React.FC = () => {
  const { data: settings, isLoading } = useSettingsQuery("order_");
  const deliverySettings = useSettingsQuery("base_delivery");
  const { mutate: updateSetting, isPending } = useSettingMutation();
  const [values, setValues] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const map: Record<string, string> = {};
    for (const s of settings ?? []) map[s.key] = s.value;
    for (const s of deliverySettings.data ?? []) map[s.key] = s.value;
    setValues(map);
  }, [settings, deliverySettings.data]);

  const handleSave = () => {
    let count = ORDER_KEYS.length;
    for (const field of ORDER_KEYS) {
      const value = values[field.key];
      if (value !== undefined) {
        updateSetting(
          { key: field.key, value, description: field.label },
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#F17922]" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-1">Configuration des commandes</h3>
      <p className="text-sm text-gray-500 mb-6">Paramètres de taxe et frais de livraison</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {ORDER_KEYS.map((field) => (
          <div key={field.key}>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              {field.label}
            </label>
            <input
              type={field.type}
              step={field.step}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
              placeholder={field.placeholder}
              value={values[field.key] ?? ""}
              onChange={(e) => setValues({ ...values, [field.key]: e.target.value })}
            />
            {field.hint && (
              <p className="text-xs text-gray-400 mt-1">{field.hint}</p>
            )}
          </div>
        ))}
      </div>

      <div className="mt-6 flex justify-end items-center gap-3">
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

export default OrderSettings;
