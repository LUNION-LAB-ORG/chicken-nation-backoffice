"use client";

import React, { useState, useEffect } from "react";
import { useSettingsQuery, useSettingMutation } from "@/hooks/useSettingsQuery";
import {
  CheckCircle,
  MessageCircle,
  MessageSquare,
  ShoppingBag,
  Eye,
  EyeOff,
  Info,
} from "lucide-react";

const TWILIO_KEYS = [
  { key: "twilio_account_sid", label: "Account SID", placeholder: "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" },
  { key: "twilio_auth_token", label: "Auth Token", placeholder: "••••••••", type: "password" },
  { key: "twilio_phone_number", label: "Numéro de téléphone SMS", placeholder: "+18383323406" },
  { key: "twilio_whatsapp_number", label: "Numéro WhatsApp", placeholder: "+22597190303" },
];

const TOGGLE_KEYS = [
  {
    key: "twilio_whatsapp_enabled",
    label: "WhatsApp",
    description: "Envoyer les messages via WhatsApp (OTP, notifications). Si désactivé, tout passe par SMS.",
    icon: MessageSquare,
    iconColor: "text-green-500",
    defaultValue: "true",
  },
  {
    key: "twilio_post_order_enabled",
    label: "Message post-commande",
    description: "Envoyer un message de confirmation aux clients sans app après chaque commande.",
    icon: ShoppingBag,
    iconColor: "text-blue-500",
    defaultValue: "true",
  },
];

const TwilioSettings: React.FC = () => {
  const { data: settings, isLoading } = useSettingsQuery("twilio_");
  const { mutate: updateSetting, isPending } = useSettingMutation();
  const [values, setValues] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const map: Record<string, string> = {};
    for (const s of settings ?? []) map[s.key] = s.value;
    setValues(map);
  }, [settings]);

  const togglePasswordVisibility = (key: string) => {
    setShowPasswords((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleToggle = (key: string, defaultValue: string) => {
    const current = values[key] ?? defaultValue;
    const newValue = current === "true" ? "false" : "true";
    setValues({ ...values, [key]: newValue });
    updateSetting(
      { key, value: newValue, description: `Twilio — ${key}` },
      {
        onSuccess: () => {
          setSaved(true);
          setTimeout(() => setSaved(false), 2000);
        },
      }
    );
  };

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
    <div className="space-y-6">
      {/* ── Configuration Twilio ─────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-1">
          <MessageCircle size={20} className="text-[#F17922]" />
          <h3 className="text-lg font-bold text-gray-900">Configuration Twilio</h3>
        </div>
        <p className="text-sm text-gray-500 mb-6">
          Identifiants Twilio pour l&apos;envoi de SMS et WhatsApp
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {TWILIO_KEYS.map((field) => (
            <div key={field.key}>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {field.label}
              </label>
              <div className="relative">
                <input
                  type={
                    field.type === "password" && !showPasswords[field.key]
                      ? "password"
                      : "text"
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all font-mono pr-10"
                  placeholder={field.placeholder}
                  value={values[field.key] ?? ""}
                  onChange={(e) =>
                    setValues({ ...values, [field.key]: e.target.value })
                  }
                />
                {field.type === "password" && (
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility(field.key)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPasswords[field.key] ? (
                      <EyeOff size={16} />
                    ) : (
                      <Eye size={16} />
                    )}
                  </button>
                )}
              </div>
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

      {/* ── Options de messagerie ────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-1">
          <MessageSquare size={20} className="text-green-500" />
          <h3 className="text-lg font-bold text-gray-900">Options de messagerie</h3>
        </div>
        <p className="text-sm text-gray-500 mb-6">
          Contrôlez les canaux d&apos;envoi et les types de messages
        </p>

        <div className="space-y-4">
          {TOGGLE_KEYS.map((toggle) => {
            const isEnabled = (values[toggle.key] ?? toggle.defaultValue) === "true";
            const Icon = toggle.icon;

            return (
              <div
                key={toggle.key}
                className="flex items-center justify-between bg-gray-50 rounded-xl px-5 py-4"
              >
                <div className="flex items-center gap-3">
                  <Icon size={20} className={toggle.iconColor} />
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {toggle.label}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {toggle.description}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleToggle(toggle.key, toggle.defaultValue)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 ${
                    isEnabled ? "bg-[#F17922]" : "bg-gray-300"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      isEnabled ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
            );
          })}
        </div>

        {/* Info box WhatsApp fallback */}
        <div className="flex items-start gap-3 bg-amber-50 rounded-xl p-4 mt-4">
          <Info size={18} className="text-amber-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm text-amber-800 font-medium">
              Fallback automatique
            </p>
            <p className="text-xs text-amber-600 mt-1">
              Lorsque WhatsApp est activé, le système tente d&apos;abord WhatsApp puis bascule
              automatiquement sur SMS en cas d&apos;échec. Si WhatsApp est désactivé, tous les
              messages sont envoyés directement par SMS.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TwilioSettings;
