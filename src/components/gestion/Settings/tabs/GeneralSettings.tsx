"use client";

import React, { useState, useEffect } from "react";
import { useSettingsQuery, useSettingMutation } from "@/hooks/useSettingsQuery";
import { CheckCircle } from "lucide-react";

const GENERAL_KEYS = [
  { key: "chicken_nation_name", label: "Nom de l'application", placeholder: "Chicken Nation" },
  { key: "chicken_nation_description", label: "Description", placeholder: "Votre référence en matière de restauration rapide..." },
  { key: "chicken_nation_url", label: "URL du site web", placeholder: "https://chicken-nation.com" },
  { key: "chicken_nation_logo", label: "URL du logo", placeholder: "https://..." },
  { key: "chicken_nation_support", label: "Email support", placeholder: "info@chicken-nation.com" },
  { key: "chicken_nation_unsubscribe_url", label: "URL de désinscription", placeholder: "https://..." },
  { key: "chicken_nation_social_links", label: "Liens sociaux", placeholder: "facebook,https://...+instagram,https://..." },
];

const GeneralSettings: React.FC = () => {
  const { data: settings, isLoading } = useSettingsQuery("chicken_nation_");
  const { mutate: updateSetting, isPending } = useSettingMutation();
  const [values, setValues] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const map: Record<string, string> = {};
    for (const s of settings ?? []) map[s.key] = s.value;
    setValues(map);
  }, [settings]);

  const handleSave = () => {
    let count = 0;
    for (const field of GENERAL_KEYS) {
      const value = values[field.key];
      if (value !== undefined) {
        count++;
        updateSetting(
          { key: field.key, value, description: field.label },
          {
            onSuccess: () => {
              count--;
              if (count === 0) {
                setSaved(true);
                setTimeout(() => setSaved(false), 2000);
              }
            },
          }
        );
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
      <h3 className="text-lg font-bold text-gray-900 mb-1">Informations Chicken Nation</h3>
      <p className="text-sm text-gray-500 mb-6">Identité et informations publiques de l&apos;application</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {GENERAL_KEYS.map((field) => (
          <div key={field.key} className={field.key === "chicken_nation_social_links" ? "md:col-span-2" : ""}>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              {field.label}
            </label>
            {field.key === "chicken_nation_description" || field.key === "chicken_nation_social_links" ? (
              <textarea
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all resize-none"
                placeholder={field.placeholder}
                rows={field.key === "chicken_nation_social_links" ? 3 : 2}
                value={values[field.key] ?? ""}
                onChange={(e) => setValues({ ...values, [field.key]: e.target.value })}
              />
            ) : (
              <input
                type="text"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
                placeholder={field.placeholder}
                value={values[field.key] ?? ""}
                onChange={(e) => setValues({ ...values, [field.key]: e.target.value })}
              />
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

export default GeneralSettings;
