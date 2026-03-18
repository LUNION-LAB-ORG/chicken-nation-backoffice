"use client";

import React, { useState, useEffect } from "react";
import { useSettingsQuery, useSettingMutation } from "@/hooks/useSettingsQuery";
import { CheckCircle, MessageCircle } from "lucide-react";

const TWILIO_KEYS = [
  { key: "twilio_account_sid", label: "Account SID", placeholder: "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" },
  { key: "twilio_auth_token", label: "Auth Token", placeholder: "••••••••", type: "password" },
  { key: "twilio_phone_number", label: "Numéro de téléphone SMS", placeholder: "+18383323406" },
  { key: "twilio_whatsapp_number", label: "Numéro WhatsApp", placeholder: "+22597190303" },
];

const TwilioSettings: React.FC = () => {
  const { data: settings, isLoading } = useSettingsQuery("twilio_");
  const { mutate: updateSetting, isPending } = useSettingMutation();
  const [values, setValues] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const map: Record<string, string> = {};
    for (const s of settings ?? []) map[s.key] = s.value;
    setValues(map);
  }, [settings]);

  const handleSave = () => {
    let count = TWILIO_KEYS.length;
    for (const field of TWILIO_KEYS) {
      const value = values[field.key];
      if (value !== undefined) {
        updateSetting(
          { key: field.key, value, description: `Twilio — ${field.label}` },
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
      <div className="flex items-center gap-3 mb-1">
        <MessageCircle size={20} className="text-[#F17922]" />
        <h3 className="text-lg font-bold text-gray-900">Configuration Twilio</h3>
      </div>
      <p className="text-sm text-gray-500 mb-6">SMS et WhatsApp via Twilio</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {TWILIO_KEYS.map((field) => (
          <div key={field.key}>
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

export default TwilioSettings;
