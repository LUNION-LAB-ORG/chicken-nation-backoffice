"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSettingsQuery, useSettingMutation } from "@/hooks/useSettingsQuery";
import { getAllRestaurants } from "@/services/restaurantService";
import {
  Building2,
  CheckCircle,
  Copy,
  CreditCard,
  Globe,
  Check,
} from "lucide-react";

/**
 * MULTI-COMPTES KKiaPay : chaque restaurant peut encaisser sur SON compte.
 *
 * - « Global » = compte historique (clés `kkiapay_*`), utilisé par défaut et
 *   comme repli tant qu'un restaurant n'a pas ses clés complètes.
 * - Par restaurant = clés `kkiapay.<restaurantId>.*` + URL de webhook DÉDIÉE
 *   (`…/kkiapay/webhook/<restaurantId>`) à coller dans le dashboard KKiaPay du
 *   compte de CE restaurant, avec SON « secret hash ».
 *
 * Les secrets sont WRITE-ONLY : le serveur renvoie un masque (********) et
 * ignore toute soumission du masque — on peut donc réenregistrer le formulaire
 * sans écraser les clés. Saisir une nouvelle valeur remplace l'ancienne.
 */

const MASK = "********";

const GLOBAL_FIELDS = [
  { suffix: "public_key", key: "kkiapay_public_key", label: "Clé publique", placeholder: "9a5c6b33...", type: "text" },
  { suffix: "private_key", key: "kkiapay_private_key", label: "Clé privée", placeholder: "pk_...", type: "password" },
  { suffix: "secret_key", key: "kkiapay_secret_key", label: "Clé secrète", placeholder: "sk_...", type: "password" },
  { suffix: "webhook_secret", key: "kkiapay_webhook_secret", label: "Webhook Secret", placeholder: "Secret hash du dashboard", type: "password" },
];

type RestaurantLite = { id: string; name: string };

const PaymentSettings: React.FC = () => {
  // « kkiapay » couvre les deux familles : kkiapay_* (global) et kkiapay.<id>.* (par restaurant).
  const { data: settings, isLoading: l1 } = useSettingsQuery("kkiapay");
  const { mutate: updateSetting, isPending } = useSettingMutation();
  const { data: restaurants = [], isLoading: l2 } = useQuery<RestaurantLite[]>({
    queryKey: ["restaurants", "payment-settings"],
    queryFn: async () => {
      const all = await getAllRestaurants();
      return (all ?? []).map((r: { id: string; name: string }) => ({ id: r.id, name: r.name }));
    },
  });

  // null = configuration GLOBALE ; sinon id du restaurant sélectionné.
  const [selected, setSelected] = useState<string | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  const [sandbox, setSandbox] = useState(false);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  const stored = useMemo(() => {
    const map: Record<string, string> = {};
    for (const s of settings ?? []) map[s.key] = s.value;
    return map;
  }, [settings]);

  useEffect(() => {
    setValues(stored);
    if (stored["kkiapay_sandbox"] !== undefined) {
      setSandbox(stored["kkiapay_sandbox"] === "true");
    }
  }, [stored]);

  /** Champs (clé de réglage réelle) du panneau sélectionné. */
  const fields = useMemo(() => {
    if (selected === null) return GLOBAL_FIELDS;
    return GLOBAL_FIELDS.map((f) => ({
      ...f,
      key: `kkiapay.${selected}.${f.suffix}`,
    }));
  }, [selected]);

  /**
   * Un restaurant est « configuré » si ses 4 clés sont présentes — WEBHOOK
   * SECRET COMPRIS : dès que les 3 clés d'API sont saisies, l'argent bascule
   * sur le compte du restaurant, or le webhook est l'UNIQUE chemin de
   * confirmation automatique des commandes. Sans lui, paiements encaissés
   * mais commandes jamais confirmées.
   */
  const isConfigured = (restaurantId: string) =>
    ["public_key", "private_key", "secret_key", "webhook_secret"].every(
      (s) => (stored[`kkiapay.${restaurantId}.${s}`] ?? "") !== ""
    );

  /** URL de webhook du panneau courant, dérivée de l'URL globale. */
  const webhookUrl = useMemo(() => {
    const defaut = "https://api-private.chicken-nation.com/api/v1/kkiapay/webhook";
    const enregistre = stored["kkiapay_webhook_path"] || "";
    // Le réglage a longtemps contenu chicken.turbodeliveryapp.com, domaine hors
    // service : une URL copiée depuis cet écran envoyait les notifications de
    // paiement dans le vide, et la commande n'était jamais confirmée. On ignore
    // donc les domaines morts connus au profit de l'adresse en service.
    const morts = ["turbodeliveryapp.com", "api-staging.chicken-nation.com"];
    const base = morts.some((m) => enregistre.includes(m)) || !enregistre
      ? defaut
      : enregistre;
    return selected === null ? base : `${base.replace(/\/$/, "")}/${selected}`;
  }, [stored, selected]);

  /** Génère un secret de webhook fort (48 hex) et le place dans le champ —
   *  la même valeur doit être collée dans le « Secret hash » du dashboard
   *  KKiaPay. Après génération, le champ passe en clair le temps de la copie. */
  const [revealedSecretKey, setRevealedSecretKey] = useState<string | null>(null);
  const generateWebhookSecret = (fieldKey: string) => {
    const bytes = new Uint8Array(24);
    crypto.getRandomValues(bytes);
    const secret = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
    setValues((v) => ({ ...v, [fieldKey]: secret }));
    setRevealedSecretKey(fieldKey);
  };

  const copyWebhookUrl = async () => {
    try {
      await navigator.clipboard.writeText(webhookUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* presse-papiers indisponible : l'URL reste sélectionnable à la main */
    }
  };

  const handleSave = () => {
    const toSave: { key: string; value: string; description: string }[] = [];
    const scope = selected === null
      ? "Global"
      : restaurants.find((r) => r.id === selected)?.name ?? selected;

    for (const field of fields) {
      const value = values[field.key];
      // On n'envoie que les champs définis ; le serveur ignore le masque
      // (write-only), donc renvoyer un champ non modifié est sans effet.
      if (value !== undefined) {
        toSave.push({ key: field.key, value, description: `KKiaPay ${scope} · ${field.label}` });
      }
    }
    if (selected === null) {
      const webhookPath = values["kkiapay_webhook_path"];
      if (webhookPath !== undefined) {
        toSave.push({ key: "kkiapay_webhook_path", value: webhookPath, description: "KKiaPay — Webhook URL (base)" });
      }
      toSave.push({ key: "kkiapay_sandbox", value: String(sandbox), description: "KKiaPay — Mode Sandbox" });
    }

    let count = toSave.length;
    if (count === 0) return;
    for (const item of toSave) {
      updateSetting(item, {
        onSuccess: () => {
          count--;
          if (count <= 0) {
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
          }
        },
      });
    }
  };

  if (l1 || l2) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#F17922]" />
      </div>
    );
  }

  const selectedName = selected === null
    ? null
    : restaurants.find((r) => r.id === selected)?.name ?? "Restaurant";

  return (
    <div className="space-y-6">
      {/* Sélecteur de compte : Global + un par restaurant */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">
          Compte à configurer
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setSelected(null)}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium border transition-colors cursor-pointer ${
              selected === null
                ? "bg-[#F17922] text-white border-[#F17922]"
                : "bg-white text-gray-700 border-gray-200 hover:border-[#F17922]/50"
            }`}
          >
            <Globe size={14} /> Global
          </button>
          {restaurants.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => setSelected(r.id)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium border transition-colors cursor-pointer ${
                selected === r.id
                  ? "bg-[#F17922] text-white border-[#F17922]"
                  : "bg-white text-gray-700 border-gray-200 hover:border-[#F17922]/50"
              }`}
            >
              <Building2 size={14} />
              {r.name}
              {isConfigured(r.id) && (
                <span
                  className={`inline-block w-1.5 h-1.5 rounded-full ${
                    selected === r.id ? "bg-white" : "bg-green-500"
                  }`}
                  title="Compte dédié configuré"
                />
              )}
            </button>
          ))}
        </div>
        {selected !== null && !isConfigured(selected) && (
          <p className="text-xs text-amber-600 mt-3">
            Compte non configuré : les paiements de ce restaurant utilisent le compte
            Global. ⚠️ Ordre impératif : d&apos;abord poser l&apos;URL de webhook + le
            Secret hash dans le dashboard KKiaPay du restaurant, PUIS enregistrer ici
            les 4 clés (webhook secret compris) — dès les clés saisies, l&apos;argent
            bascule sur ce compte et seul son webhook confirme les commandes.
          </p>
        )}
      </div>

      {/* Clés du compte sélectionné */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-1">
          <CreditCard size={20} className="text-[#F17922]" />
          <h3 className="text-lg font-bold text-gray-900">
            {selected === null
              ? "Configuration KKiaPay — Global"
              : `Configuration KKiaPay — ${selectedName}`}
          </h3>
        </div>
        <p className="text-sm text-gray-500 mb-6">
          {selected === null
            ? "Compte historique : utilisé par défaut et comme repli pour les restaurants non configurés."
            : "Clés du compte KKiaPay dédié à ce restaurant (dashboard KKiaPay → Développeurs → API)."}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {fields.map((field) => (
            <div key={field.key}>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium text-gray-700">
                  {field.label}
                </label>
                {field.suffix === "webhook_secret" && (
                  <button
                    type="button"
                    onClick={() => generateWebhookSecret(field.key)}
                    className="text-xs font-medium text-[#F17922] hover:underline cursor-pointer"
                  >
                    Générer un secret
                  </button>
                )}
              </div>
              <input
                type={revealedSecretKey === field.key ? "text" : field.type}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all font-mono"
                placeholder={field.placeholder}
                value={values[field.key] ?? ""}
                onChange={(e) => setValues({ ...values, [field.key]: e.target.value })}
                // Au focus d'un secret masqué, on vide le champ : taper à la
                // suite du masque enverrait « ********sk_… » (refusé serveur).
                onFocus={() => {
                  if ((values[field.key] ?? "") === MASK) {
                    setValues({ ...values, [field.key]: "" });
                  }
                }}
                onBlur={() => {
                  // Champ laissé vide après avoir vidé le masque : on restaure
                  // le masque (= « valeur inchangée »), sinon Enregistrer
                  // écraserait le secret par une chaîne vide.
                  if ((values[field.key] ?? "") === "" && (stored[field.key] ?? "") !== "") {
                    setValues({ ...values, [field.key]: stored[field.key] });
                  }
                }}
              />
              {field.type === "password" && (values[field.key] ?? "") === MASK && (
                <p className="text-[11px] text-gray-400 mt-1">
                  Valeur enregistrée (masquée). Saisis une nouvelle valeur pour la remplacer.
                </p>
              )}
              {revealedSecretKey === field.key && (
                <p className="text-[11px] text-amber-600 mt-1">
                  Copie cette valeur dans le « Secret hash » du dashboard KKiaPay,
                  puis Enregistrer ici — les deux côtés doivent porter le même secret.
                </p>
              )}
            </div>
          ))}

          {selected === null && (
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Webhook URL (base)
              </label>
              <input
                type="text"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all font-mono"
                placeholder="https://api-private.chicken-nation.com/api/v1/kkiapay/webhook"
                value={values["kkiapay_webhook_path"] ?? ""}
                onChange={(e) => setValues({ ...values, kkiapay_webhook_path: e.target.value })}
              />
            </div>
          )}
        </div>

        {/* URL de webhook à coller dans le dashboard KKiaPay du compte sélectionné */}
        <div className="mt-5 rounded-xl bg-gray-50 border border-gray-200 p-4">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
            URL de webhook {selected === null ? "du compte global" : "de ce restaurant"}
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-[13px] text-gray-800 break-all">{webhookUrl}</code>
            <button
              type="button"
              onClick={copyWebhookUrl}
              className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-300 bg-white text-xs font-medium text-gray-700 hover:border-[#F17922]/60 cursor-pointer"
            >
              {copied ? <Check size={13} className="text-green-600" /> : <Copy size={13} />}
              {copied ? "Copiée" : "Copier"}
            </button>
          </div>
          <p className="text-[11px] text-gray-400 mt-2">
            Dashboard KKiaPay {selected === null ? "" : "de ce restaurant "}→ Développeurs → Webhook :
            colle cette URL et renseigne le même « Secret hash » que le champ Webhook Secret ci-dessus.
          </p>
        </div>
      </div>

      {/* Sandbox : réglage GLOBAL (hérité par les restaurants sans réglage propre) */}
      {selected === null && (
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
              className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors cursor-pointer ${
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
      )}

      <div className="flex justify-end items-center gap-3">
        {saved && (
          <span className="flex items-center gap-1.5 text-green-600 text-sm font-medium">
            <CheckCircle size={16} /> Enregistré
          </span>
        )}
        <button
          onClick={handleSave}
          disabled={isPending}
          className="px-6 py-2.5 bg-[#F17922] text-white font-semibold rounded-xl hover:bg-[#e06816] transition-all disabled:opacity-50 cursor-pointer"
        >
          {isPending ? "Enregistrement..." : "Enregistrer"}
        </button>
      </div>
    </div>
  );
};

export default PaymentSettings;
