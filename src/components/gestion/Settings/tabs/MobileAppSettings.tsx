"use client";

import React, { useState, useEffect } from "react";
import { useSettingsQuery, useSettingMutation } from "@/hooks/useSettingsQuery";
import { CheckCircle, Smartphone } from "lucide-react";

const MOBILE_KEYS = [
  { key: "play_store_link", label: "Lien Google Play Store", placeholder: "https://play.google.com/store/apps/details?id=..." },
  { key: "app_store_link", label: "Lien Apple App Store", placeholder: "https://apps.apple.com/..." },
  { key: "version_app_mobile", label: "Version actuelle de l'app", placeholder: "1.0.0" },
];

const MobileAppSettings: React.FC = () => {
  const { data: playStore, isLoading: l1 } = useSettingsQuery("play_store");
  const { data: appStore, isLoading: l2 } = useSettingsQuery("app_store");
  const { data: versionSettings, isLoading: l3 } = useSettingsQuery("version_app");
  const { data: forceSettings, isLoading: l4 } = useSettingsQuery("force_update");
  const { mutate: updateSetting, isPending } = useSettingMutation();
  const [values, setValues] = useState<Record<string, string>>({});
  const [forceUpdate, setForceUpdate] = useState(true);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const map: Record<string, string> = {};
    for (const s of [...(playStore ?? []), ...(appStore ?? []), ...(versionSettings ?? []), ...(forceSettings ?? [])]) {
      map[s.key] = s.value;
    }
    setValues(map);
    if (map["force_update_app_mobile"] !== undefined) {
      setForceUpdate(map["force_update_app_mobile"] === "true");
    }
  }, [playStore, appStore, versionSettings, forceSettings]);

  const handleSave = () => {
    const allFields = [
      ...MOBILE_KEYS,
      { key: "force_update_app_mobile", label: "Forcer la mise à jour" },
    ];
    let count = allFields.length;
    for (const field of allFields) {
      const value = field.key === "force_update_app_mobile"
        ? String(forceUpdate)
        : values[field.key];
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

  if (l1 || l2 || l3 || l4) {
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
          <Smartphone size={20} className="text-[#F17922]" />
          <h3 className="text-lg font-bold text-gray-900">Application Mobile</h3>
        </div>
        <p className="text-sm text-gray-500 mb-6">Liens des stores et gestion de version</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {MOBILE_KEYS.map((field) => (
            <div key={field.key} className={field.key.includes("store") ? "md:col-span-2" : ""}>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {field.label}
              </label>
              <input
                type="text"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
                placeholder={field.placeholder}
                value={values[field.key] ?? ""}
                onChange={(e) => setValues({ ...values, [field.key]: e.target.value })}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Force update toggle */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Forcer la mise à jour</h3>
            <p className="text-sm text-gray-500 mt-1">
              Oblige les utilisateurs à mettre à jour l&apos;app avant de pouvoir l&apos;utiliser
            </p>
          </div>
          <button
            onClick={() => setForceUpdate(!forceUpdate)}
            className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
              forceUpdate ? "bg-[#F17922]" : "bg-gray-300"
            }`}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform ${
                forceUpdate ? "translate-x-6" : "translate-x-1"
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

export default MobileAppSettings;
