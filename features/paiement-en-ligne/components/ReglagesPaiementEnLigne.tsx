"use client";

import React, { useState } from "react";
import { AlertTriangle, Power, Wallet } from "lucide-react";
import { useConfigurationPaiementQuery, useReglagesPaiementMutation } from "../queries/paiement-en-ligne.query";
import type { Fournisseur } from "../types/paiement-en-ligne.types";
import { alertePaiementEnLigne } from "../utils/paiement-en-ligne";

const LIBELLES: Record<Fournisseur, string> = { kkiapay: "KKiaPay", paystack: "Paystack" };

/**
 * Paiement en ligne de l'appli et du site (25/11) : interrupteur et
 * prestataire. Changer de prestataire demande une confirmation : l'effet est
 * immédiat pour tous les clients.
 */
export default function ReglagesPaiementEnLigne() {
  const { data: config, isLoading } = useConfigurationPaiementQuery();
  const { mutate: enregistrer, isPending } = useReglagesPaiementMutation();
  const [aConfirmer, setAConfirmer] = useState<{ fournisseur?: Fournisseur; actif?: boolean } | null>(null);

  if (isLoading || !config) {
    return <div className="bg-white rounded-2xl border border-gray-200 p-6 h-40 animate-pulse" />;
  }

  const alerte = alertePaiementEnLigne(config);
  const confirmer = () => {
    if (!aConfirmer) return;
    enregistrer(
      { ...(aConfirmer.fournisseur ? { fournisseur: aConfirmer.fournisseur } : {}), ...(aConfirmer.actif !== undefined ? { en_ligne_actif: aConfirmer.actif } : {}) },
      { onSettled: () => setAConfirmer(null) },
    );
  };

  const texteConfirmation = (() => {
    if (!aConfirmer) return "";
    if (aConfirmer.actif === false) {
      return "Couper le paiement en ligne ? L'appli et le site ne proposeront plus que le paiement à la livraison ou au restaurant.";
    }
    if (aConfirmer.actif === true) return "Rétablir le paiement en ligne dans l'appli et sur le site ?";
    if (aConfirmer.fournisseur === "paystack") {
      return "Passer à Paystack ? Dès maintenant, l'appli à jour et le site paient par Paystack, sur le sous-compte de chaque restaurant. Un restaurant sans sous-compte prêt ne propose plus le paiement en ligne, et les anciennes versions de l'appli demandent une mise à jour.";
    }
    return "Revenir à KKiaPay ? Dès maintenant, l'appli et le site paient par KKiaPay, sur le compte KKiaPay de chaque restaurant.";
  })();

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <Wallet size={20} className="text-[#F17922]" />
            <h3 className="text-lg font-bold text-gray-900">Paiement en ligne</h3>
          </div>
          <p className="text-sm text-gray-500 mt-1">Pour l&apos;appli et le site. L&apos;effet est immédiat.</p>
        </div>
        <button
          type="button"
          disabled={isPending}
          onClick={() => setAConfirmer({ actif: !config.en_ligne_actif })}
          aria-pressed={config.en_ligne_actif}
          aria-label={config.en_ligne_actif ? "Couper le paiement en ligne" : "Rétablir le paiement en ligne"}
          className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors cursor-pointer disabled:opacity-50 ${
            config.en_ligne_actif ? "bg-[#F17922]" : "bg-gray-300"
          }`}
        >
          <span
            className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform ${
              config.en_ligne_actif ? "translate-x-6" : "translate-x-1"
            }`}
          />
        </button>
      </div>

      <div>
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Prestataire</p>
        <div className="inline-flex rounded-xl border border-gray-200 p-1 bg-gray-50">
          {(["kkiapay", "paystack"] as Fournisseur[]).map((f) => (
            <button
              key={f}
              type="button"
              disabled={isPending || !config.en_ligne_actif}
              onClick={() => f !== config.fournisseur && setAConfirmer({ fournisseur: f })}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer disabled:cursor-not-allowed ${
                config.fournisseur === f ? "bg-[#F17922] text-blanc" : "text-gray-700 hover:text-gray-900"
              } ${!config.en_ligne_actif ? "opacity-60" : ""}`}
            >
              {LIBELLES[f]}
            </button>
          ))}
        </div>
      </div>

      {alerte && (
        <div
          className={`flex items-start gap-2 rounded-xl px-4 py-3 text-sm ${
            alerte.ton === "rouge" ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700"
          }`}
        >
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          <span>{alerte.texte}</span>
        </div>
      )}

      {aConfirmer && (
        <div className="rounded-xl border border-[#F17922]/40 bg-orange-50 p-4 space-y-3">
          <p className="text-sm text-gray-800 flex items-start gap-2">
            <Power size={16} className="text-[#F17922] mt-0.5 shrink-0" />
            {texteConfirmation}
          </p>
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => setAConfirmer(null)}
              className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-sm font-medium text-gray-700 cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={confirmer}
              disabled={isPending}
              className="px-4 py-2 rounded-lg bg-[#F17922] text-blanc text-sm font-semibold cursor-pointer disabled:opacity-50"
            >
              {isPending ? "Enregistrement..." : "Confirmer"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
