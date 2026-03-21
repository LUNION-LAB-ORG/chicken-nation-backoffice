"use client";

import React, { useState, useEffect } from "react";
import { useSettingsQuery, useSettingMutation } from "@/hooks/useSettingsQuery";
import { triggerTagsSync } from "@/services/onesignalService";
import {
  Bell,
  CheckCircle,
  Smartphone,
  Info,
  Eye,
  EyeOff,
  Tag,
  RefreshCw,
  Loader2,
} from "lucide-react";

// ─── OneSignal ───────────────────────────────────────────────────────────────
const ONESIGNAL_KEYS = [
  {
    key: "onesignal_app_id",
    label: "App ID",
    placeholder: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
    type: "text",
    description: "Identifiant de votre application OneSignal",
  },
  {
    key: "onesignal_api_key",
    label: "REST API Key",
    placeholder: "••••••••",
    type: "password",
    description: "Clé API REST pour les appels serveur",
  },
];

// 5 tags marketing synchronisés (modèle RFM + géo + fidélité)
const AUTO_TAGS = [
  {
    key: "orders",
    label: "Nombre de commandes",
    description: "Total des commandes complétées — segmenter par fréquence d'achat",
    source: "commandes",
    example: "Ex : orders > 5 → clients fidèles",
  },
  {
    key: "total_spent",
    label: "Total dépensé (FCFA)",
    description: "Montant cumulé des commandes — identifier les gros acheteurs",
    source: "commandes",
    example: "Ex : total_spent > 50000 → clients à forte valeur",
  },
  {
    key: "loyalty_level",
    label: "Niveau de fidélité",
    description: "STANDARD, PREMIUM ou GOLD — offres personnalisées par tier",
    source: "fidélité",
    example: "Ex : loyalty_level = GOLD → offres VIP exclusives",
  },
];

const NotificationSettings: React.FC = () => {
  // ─── OneSignal settings ────────────────────────────────────────────────────
  const { data: onesignalSettings, isLoading } = useSettingsQuery("onesignal_");
  const { mutate: updateSetting, isPending } = useSettingMutation();

  const [values, setValues] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{ type: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    const map: Record<string, string> = {};
    for (const s of onesignalSettings ?? []) map[s.key] = s.value;
    setValues(map);
  }, [onesignalSettings]);

  const isEnabled = values["onesignal_enabled"] === "true";

  const toggleEnabled = () => {
    setValues({ ...values, onesignal_enabled: isEnabled ? "false" : "true" });
  };

  const togglePasswordVisibility = (key: string) => {
    setShowPasswords((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = () => {
    const allKeys = [...ONESIGNAL_KEYS.map((f) => f.key), "onesignal_enabled"];
    let count = allKeys.length;

    for (const key of allKeys) {
      const value = values[key];
      if (value !== undefined) {
        const label =
          ONESIGNAL_KEYS.find((f) => f.key === key)?.label ??
          (key === "onesignal_enabled" ? "Activation" : key);

        updateSetting(
          { key, value, description: `OneSignal — ${label}` },
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

  const handleSync = async () => {
    setSyncing(true);
    setSyncResult(null);
    try {
      const res = await triggerTagsSync();
      setSyncResult({ type: "success", message: res.message ?? "Synchronisation lancée !" });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erreur lors du lancement de la synchronisation";
      setSyncResult({ type: "error", message: msg });
    } finally {
      setSyncing(false);
      setTimeout(() => setSyncResult(null), 5000);
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
      {/* ── OneSignal Card ────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-3">
            <Bell size={20} className="text-[#F17922]" />
            <h3 className="text-lg font-bold text-gray-900">OneSignal</h3>
          </div>

          {/* Toggle enabled */}
          <button
            type="button"
            onClick={toggleEnabled}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
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
        <p className="text-sm text-gray-500 mb-6">
          Notifications push, e-mail et SMS via OneSignal
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {ONESIGNAL_KEYS.map((field) => (
            <div key={field.key}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {field.label}
              </label>
              <p className="text-xs text-gray-400 mb-1.5">{field.description}</p>
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
              <CheckCircle size={16} /> Enregistre
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

      {/* ── Tags automatiques Card ────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-1">
          <Tag size={20} className="text-blue-500" />
          <h3 className="text-lg font-bold text-gray-900">Tags automatiques</h3>
        </div>
        <p className="text-sm text-gray-500 mb-4">
          Tags OneSignal mis à jour automatiquement par les tâches CRON du backend
        </p>

        <div className="space-y-3">
          {AUTO_TAGS.map((tag) => (
            <div
              key={tag.key}
              className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3"
            >
              <div>
                <p className="text-sm font-medium text-gray-900">{tag.label}</p>
                <p className="text-xs text-gray-400">
                  Clé : <code className="bg-gray-200 px-1 rounded text-gray-600">{tag.key}</code>
                  {" "}&middot;{" "}{tag.description}
                </p>
                <p className="text-xs text-gray-300 italic mt-0.5">{tag.example}</p>
              </div>
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                tag.source === "commandes" ? "bg-blue-50 text-blue-600" :
                tag.source === "client" ? "bg-green-50 text-green-600" :
                tag.source === "fidélité" ? "bg-purple-50 text-purple-600" :
                "bg-gray-100 text-gray-600"
              }`}>
                {tag.source}
              </span>
            </div>
          ))}
        </div>

        <div className="flex items-start gap-3 bg-blue-50 rounded-xl p-4 mt-4">
          <Info size={18} className="text-blue-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm text-blue-800 font-medium">
              Programmation des tags
            </p>
            <p className="text-xs text-blue-600 mt-1">
              Ces tags sont synchronisés automatiquement avec OneSignal tous les jours à 03h00 (GMT+0).
              Seuls les clients modifiés depuis le dernier sync sont mis à jour (delta sync).
              Vous pouvez aussi lancer une synchronisation manuelle ci-dessous.
            </p>
          </div>
        </div>

        {/* Bouton Sync + feedback */}
        <div className="flex items-center gap-3 mt-4">
          <button
            onClick={handleSync}
            disabled={syncing}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-all disabled:opacity-50"
          >
            {syncing ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <RefreshCw size={16} />
            )}
            {syncing ? "Synchronisation en cours..." : "Synchroniser les tags maintenant"}
          </button>

          {syncResult && (
            <span
              className={`text-sm font-medium ${
                syncResult.type === "success" ? "text-green-600" : "text-red-600"
              }`}
            >
              {syncResult.type === "success" && <CheckCircle size={14} className="inline mr-1" />}
              {syncResult.message}
            </span>
          )}
        </div>
      </div>

      {/* ── Expo Push Card (read-only info) ───────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-1">
          <Smartphone size={20} className="text-purple-500" />
          <h3 className="text-lg font-bold text-gray-900">Expo Push</h3>
        </div>
        <p className="text-sm text-gray-500 mb-4">
          Notifications push via le SDK Expo (application mobile)
        </p>

        <div className="flex items-start gap-3 bg-purple-50 rounded-xl p-4">
          <Info size={18} className="text-purple-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm text-purple-800 font-medium">
              Configuration automatique
            </p>
            <p className="text-sm text-purple-600 mt-1">
              Les notifications Expo Push sont gérées automatiquement par le SDK
              mobile. Aucune configuration manuelle n&apos;est nécessaire ici. Les
              tokens push sont enregistrés lors de la première connexion de
              l&apos;utilisateur.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationSettings;
