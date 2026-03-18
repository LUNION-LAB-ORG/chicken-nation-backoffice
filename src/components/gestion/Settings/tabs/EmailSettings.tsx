"use client";

import React, { useState, useEffect } from "react";
import { useSettingsQuery, useSettingMutation } from "@/hooks/useSettingsQuery";
import { CheckCircle } from "lucide-react";

const PROVIDERS = [
  { value: "default", label: "Hostinger (par défaut)" },
  { value: "google", label: "Google Gmail" },
];

const DEFAULT_SMTP_KEYS = [
  { key: "email_host", label: "Serveur SMTP", placeholder: "smtp.hostinger.com" },
  { key: "email_port", label: "Port", placeholder: "465", type: "number" },
  { key: "email_user", label: "Utilisateur", placeholder: "info@chicken-nation.com" },
  { key: "email_password", label: "Mot de passe", placeholder: "••••••••", type: "password" },
  { key: "email_sender", label: "Expéditeur", placeholder: "Chicken Nation <info@chicken-nation.com>" },
];

const GOOGLE_SMTP_KEYS = [
  { key: "google_email_host", label: "Serveur SMTP Google", placeholder: "smtp.gmail.com" },
  { key: "google_email_port", label: "Port", placeholder: "587", type: "number" },
  { key: "google_email_user", label: "Utilisateur Gmail", placeholder: "user@gmail.com" },
  { key: "google_email_password", label: "Mot de passe d'application", placeholder: "••••••••", type: "password" },
  { key: "google_email_sender", label: "Expéditeur", placeholder: "Chicken Nation <user@gmail.com>" },
];

const EmailSettings: React.FC = () => {
  const { data: emailSettings, isLoading: l1 } = useSettingsQuery("email_");
  const { data: googleSettings, isLoading: l2 } = useSettingsQuery("google_email_");
  const { mutate: updateSetting, isPending } = useSettingMutation();
  const [values, setValues] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const map: Record<string, string> = {};
    for (const s of emailSettings ?? []) map[s.key] = s.value;
    for (const s of googleSettings ?? []) map[s.key] = s.value;
    setValues(map);
  }, [emailSettings, googleSettings]);

  const provider = values["email_provider"] || "default";

  const handleSave = () => {
    const allKeys = [
      { key: "email_provider", label: "Fournisseur email actif" },
      ...DEFAULT_SMTP_KEYS,
      ...GOOGLE_SMTP_KEYS,
    ];
    let count = allKeys.length;
    for (const field of allKeys) {
      const value = values[field.key];
      if (value !== undefined) {
        updateSetting(
          { key: field.key, value, description: `Configuration email — ${field.label}` },
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

  if (l1 || l2) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#F17922]" />
      </div>
    );
  }

  const renderFields = (fields: typeof DEFAULT_SMTP_KEYS) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      {fields.map((field) => (
        <div key={field.key}>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            {field.label}
          </label>
          <input
            type={field.type || "text"}
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
            placeholder={field.placeholder}
            value={values[field.key] ?? ""}
            onChange={(e) => setValues({ ...values, [field.key]: e.target.value })}
          />
        </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Provider selector */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-1">Fournisseur d&apos;email actif</h3>
        <p className="text-sm text-gray-500 mb-4">
          Sélectionnez le service SMTP utilisé pour envoyer les emails
        </p>
        <div className="flex gap-3">
          {PROVIDERS.map((p) => (
            <button
              key={p.value}
              onClick={() => setValues({ ...values, email_provider: p.value })}
              className={`px-5 py-2.5 rounded-xl text-sm font-medium border-2 transition-all ${
                provider === p.value
                  ? "border-[#F17922] bg-orange-50 text-[#F17922]"
                  : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Default SMTP */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="text-lg font-bold text-gray-900">SMTP Hostinger</h3>
          {provider === "default" && (
            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">Actif</span>
          )}
        </div>
        <p className="text-sm text-gray-500 mb-5">Configuration du serveur Hostinger</p>
        {renderFields(DEFAULT_SMTP_KEYS)}
      </div>

      {/* Google SMTP */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="text-lg font-bold text-gray-900">SMTP Google</h3>
          {provider === "google" && (
            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">Actif</span>
          )}
        </div>
        <p className="text-sm text-gray-500 mb-5">Configuration du serveur Gmail (mot de passe d&apos;application requis)</p>
        {renderFields(GOOGLE_SMTP_KEYS)}
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

export default EmailSettings;
