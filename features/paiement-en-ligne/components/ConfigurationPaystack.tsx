"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Building2, Check, CheckCircle, Copy, CreditCard, RefreshCw, XCircle } from "lucide-react";
import { useSettingMutation, useSettingsQuery } from "@/hooks/useSettingsQuery";
import {
  useConfigurationPaiementQuery,
  useRelierSousCompteMutation,
  useRelireConfigurationPaiement,
  useSousComptesPaystackQuery,
} from "../queries/paiement-en-ligne.query";
import type { RestaurantPaystack, SousComptePaystack } from "../types/paiement-en-ligne.types";
import { partLisible, urlWebhookPaystack } from "../utils/paiement-en-ligne";
import FraisPaystack from "./FraisPaystack";

const MASQUE = "********";
const CHAMPS = [
  { cle: "paystack_secret_key", libelle: "Clé secrète", aide: "sk_live_… (ou sk_test_… pour les essais)" },
  { cle: "paystack_webhook_secret", libelle: "Secret de signature des webhooks", aide: "whsec_… (facultatif)" },
] as const;

/**
 * Paystack (25/11) : clé secrète, adresse du webhook, et sous-compte de
 * chaque restaurant. L'argent va en entier au sous-compte du restaurant,
 * frais Paystack compris : un sous-compte qui laisse une part au compte
 * principal est refusé par le serveur.
 */
export default function ConfigurationPaystack() {
  const { data: config } = useConfigurationPaiementQuery();
  const { data: reglages } = useSettingsQuery("paystack");
  const { mutate: enregistrerReglage, isPending: enregistrement } = useSettingMutation();
  const relire = useRelireConfigurationPaiement();
  const cleOk = !!config?.paystack.cle_configuree;
  const { data: sousComptes = [], error: erreurListe, isFetching: lectureListe } = useSousComptesPaystackQuery(cleOk);

  const enregistres = useMemo(() => {
    const m: Record<string, string> = {};
    for (const s of reglages ?? []) m[s.key] = s.value;
    return m;
  }, [reglages]);
  const [valeurs, setValeurs] = useState<Record<string, string>>({});
  useEffect(() => setValeurs(enregistres), [enregistres]);
  const [copie, setCopie] = useState(false);
  const webhook = urlWebhookPaystack();

  const enregistrerCles = () => {
    const aEnvoyer = CHAMPS.filter((c) => (valeurs[c.cle] ?? "") !== (enregistres[c.cle] ?? "") && (valeurs[c.cle] ?? "") !== MASQUE);
    let reste = aEnvoyer.length;
    for (const c of aEnvoyer) {
      enregistrerReglage(
        { key: c.cle, value: (valeurs[c.cle] ?? "").trim(), description: `Paystack · ${c.libelle}` },
        {
          onSuccess: () => {
            reste -= 1;
            if (reste <= 0) relire.mutate();
          },
        },
      );
    }
  };

  const copier = async () => {
    try {
      await navigator.clipboard.writeText(webhook);
      setCopie(true);
      setTimeout(() => setCopie(false), 2000);
    } catch {
      /* presse-papiers indisponible : l'adresse reste sélectionnable */
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-6 space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
        <div className="min-w-0 flex-1 basis-56">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <CreditCard size={20} className="text-[#F17922]" />
            <h3 className="text-lg font-bold text-gray-900">Paystack</h3>
            {config?.paystack.mode && (
              <span
                className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                  config.paystack.mode === "live" ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"
                }`}
              >
                {config.paystack.mode === "live" ? "Réel" : "Test"}
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Chaque restaurant encaisse sur son sous-compte. Le compte principal ne garde pas plus que le taux des frais de service.
          </p>
        </div>
        <button
          type="button"
          onClick={() => relire.mutate()}
          disabled={relire.isPending}
          className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-300 bg-white text-xs font-medium text-gray-700 hover:border-[#F17922]/60 cursor-pointer disabled:opacity-50"
        >
          <RefreshCw size={13} className={relire.isPending ? "animate-spin" : ""} />
          Relire chez Paystack
        </button>
      </div>

      {/* Clés */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {CHAMPS.map((c) => (
          <div key={c.cle}>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">{c.libelle}</label>
            <input
              type="password"
              autoComplete="off"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all font-mono"
              placeholder={c.aide}
              value={valeurs[c.cle] ?? ""}
              onChange={(e) => setValeurs({ ...valeurs, [c.cle]: e.target.value })}
              onFocus={() => {
                if ((valeurs[c.cle] ?? "") === MASQUE) setValeurs({ ...valeurs, [c.cle]: "" });
              }}
              onBlur={() => {
                if ((valeurs[c.cle] ?? "") === "" && (enregistres[c.cle] ?? "") !== "") {
                  setValeurs({ ...valeurs, [c.cle]: enregistres[c.cle] });
                }
              }}
            />
            {(valeurs[c.cle] ?? "") === MASQUE && (
              <p className="text-[11px] text-gray-400 mt-1">Valeur enregistrée (masquée). Saisissez-en une nouvelle pour la remplacer.</p>
            )}
          </div>
        ))}
      </div>
      <div className="flex justify-end">
        <button
          type="button"
          onClick={enregistrerCles}
          disabled={enregistrement}
          className="px-5 py-2 bg-[#F17922] text-blanc text-sm font-semibold rounded-xl hover:bg-[#e06816] transition-all disabled:opacity-50 cursor-pointer"
        >
          {enregistrement ? "Enregistrement..." : "Enregistrer les clés"}
        </button>
      </div>

      {/* Webhook */}
      <div className="rounded-xl bg-gray-50 border border-gray-200 p-4">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Adresse du webhook</p>
        <div className="flex items-center gap-2">
          <code className="flex-1 text-[13px] text-gray-800 break-all">{webhook}</code>
          <button
            type="button"
            onClick={copier}
            className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-300 bg-white text-xs font-medium text-gray-700 hover:border-[#F17922]/60 cursor-pointer"
          >
            {copie ? <Check size={13} className="text-green-600" /> : <Copy size={13} />}
            {copie ? "Copiée" : "Copier"}
          </button>
        </div>
        <p className="text-[11px] text-gray-400 mt-2">
          Tableau de bord Paystack, Settings, API Keys &amp; Webhooks : collez cette adresse dans « Webhook URL ».
        </p>
      </div>

      {/* Frais ajoutés au client */}
      {config?.frais && <FraisPaystack frais={config.frais} fraisService={config.frais_service} />}

      {/* Sous-comptes des restaurants */}
      <div>
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Sous-compte de chaque restaurant</p>
        {!cleOk && <p className="text-sm text-gray-500">Enregistrez la clé secrète pour choisir les sous-comptes.</p>}
        {cleOk && erreurListe && (
          <p className="text-sm text-red-600 mb-3">{(erreurListe as Error).message || "Liste des sous-comptes illisible."}</p>
        )}
        <div className="divide-y divide-gray-200 rounded-xl border border-gray-200">
          {(config?.restaurants ?? []).map((r) => (
            <LigneRestaurant key={r.id} restaurant={r} sousComptes={sousComptes} desactive={!cleOk || lectureListe} />
          ))}
        </div>
      </div>
    </div>
  );
}

function LigneRestaurant({
  restaurant,
  sousComptes,
  desactive,
}: {
  restaurant: RestaurantPaystack;
  sousComptes: SousComptePaystack[];
  desactive: boolean;
}) {
  const { mutate: relier, isPending } = useRelierSousCompteMutation();
  const code = restaurant.sous_compte?.code ?? "";
  const s = restaurant.sous_compte;
  const options = useMemo(() => {
    const liste = [...sousComptes];
    if (code && !liste.some((x) => x.code === code)) {
      liste.unshift({ code, nom: s?.nom ?? null, banque: null, compte: null, partComptePrincipal: null, actif: false, devise: null });
    }
    return liste;
  }, [sousComptes, code, s?.nom]);

  return (
    <div className="flex flex-col md:flex-row md:items-center gap-3 p-4">
      <div className="flex items-center gap-2 md:w-56 shrink-0">
        <Building2 size={15} className="text-gray-400" />
        <span className="text-sm font-medium text-gray-900">{restaurant.nom}</span>
      </div>
      <select
        value={code}
        disabled={desactive || isPending}
        onChange={(e) => relier({ restaurantId: restaurant.id, code: e.target.value || null, nom: restaurant.nom })}
        className="flex-1 min-w-0 border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-60"
      >
        <option value="">Aucun sous-compte</option>
        {options.map((o) => (
          <option key={o.code} value={o.code}>
            {(o.nom ?? o.code) + ` (${o.code})`}
            {o.utilisable === false ? " · non utilisable" : ""}
          </option>
        ))}
      </select>
      <div className="md:w-72 shrink-0 text-xs">
        {restaurant.utilisable ? (
          <span className="inline-flex items-center gap-1.5 text-green-700">
            <CheckCircle size={14} />
            Prêt · {s?.banque ?? "banque inconnue"} {s?.compte ?? ""} · part du compte principal {partLisible(s?.partComptePrincipal)}
          </span>
        ) : (
          <span className="inline-flex items-start gap-1.5 text-amber-700">
            <XCircle size={14} className="mt-px shrink-0" />
            {restaurant.motif ?? "Pas de paiement en ligne"}
          </span>
        )}
      </div>
    </div>
  );
}
