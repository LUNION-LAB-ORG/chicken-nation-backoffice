"use client";

import React from "react";
import { Headset, Smartphone, type LucideIcon } from "lucide-react";

interface OrigineSelectorProps {
  /** `true` = commande de l'application, `false` = saisie par le personnel. */
  auto: boolean;
  onChange: (auto: boolean) => void;
  /** Le passage vers « Application » est refusé tant que la commande attend. */
  enAttente?: boolean;
  /**
   * Origine ENREGISTRÉE de la commande, et non celle du formulaire :
   * l'avertissement de bascule doit rester lisible après le clic sur « Call
   * center », c'est-à-dire juste avant d'enregistrer.
   */
  etaitAuto?: boolean;
  /**
   * Pourquoi la bascule ne touche ni à la taxe ni au total, décidé par le
   * serveur selon les mêmes règles (`OrderService.update`) :
   *  - `payee` : le client a déjà réglé, taxe comprise ;
   *  - `livraison` : la course est partie avec ce montant à encaisser ;
   *  - `null` : la taxe tombe à zéro et le total est recalculé.
   */
  montantFige?: "payee" | "livraison" | null;
  /**
   * Ce que la bascule fait du paiement, mêmes règles :
   *  - `caisse` : payable dans l'application et pas soldée, la caisse
   *    encaisse ce qui reste à payer ;
   *  - `livreur` : un encaissement du livreur attend sa confirmation, le
   *    paiement ne change pas ;
   *  - `inchange` : déjà payée, ou déjà payable au restaurant (espèces
   *    choisies dans l'appli).
   */
  paiementApresBascule?: "caisse" | "livreur" | "inchange";
  /**
   * Panier de l'application encore en attente de paiement (relance). Sur
   * « Call center », le client peut toujours payer dans l'application
   * pendant la reprise : on le rappelle à l'agent, qui doit le prévenir. Sur
   * « Application », rien n'est repris : on le dit avant l'enregistrement.
   */
  brouillon?: boolean;
}

const ORIGINES: { auto: boolean; label: string; desc: string; icon: LucideIcon }[] = [
  { auto: false, label: "Call center", desc: "Saisie par le personnel", icon: Headset },
  { auto: true, label: "Application", desc: "Passée par le client", icon: Smartphone },
];

/**
 * ORIGINE d'une commande, en modification seulement.
 *
 * Elle sépare les commandes de l'application de celles saisies par le
 * personnel, et cette séparation se retrouve partout : le suivi « Nouveaux
 * App / Nouveaux Call Center », les listes, les exports. Une commande mal
 * classée fausse durablement la lecture de l'acquisition, d'où ce correctif.
 *
 * ⚠️ Volontairement absent de la CRÉATION. Une commande saisie au backoffice
 * est par définition une commande du personnel : offrir la bascule là
 * permettrait de fabriquer de fausses commandes « application » et de gonfler
 * un chiffre que personne ne pourrait plus démêler.
 */
const OrigineSelector: React.FC<OrigineSelectorProps> = ({
  auto,
  onChange,
  enAttente = false,
  etaitAuto = auto,
  montantFige = null,
  paiementApresBascule = "inchange",
  brouillon = false,
}) => {
  return (
    <div>
      <label className="text-xs font-semibold text-gray-500 mb-1.5 block">
        Origine de la commande
      </label>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {ORIGINES.map((o) => {
          const selected = auto === o.auto;
          // Le serveur refuse ce passage sur une commande en attente : ne pas
          // le proposer vaut mieux que de le faire échouer après le clic.
          const bloque = o.auto && enAttente && !selected;
          const Icon = o.icon;
          return (
            <button
              key={o.label}
              type="button"
              disabled={bloque}
              onClick={() => onChange(o.auto)}
              aria-pressed={selected}
              title={
                bloque
                  ? "Commande encore en attente : confirmez-la d'abord, sinon elle disparaîtrait de la liste."
                  : undefined
              }
              className={`flex items-center gap-3 rounded-xl border px-3.5 py-3 text-left transition disabled:opacity-50 disabled:cursor-not-allowed ${
                selected
                  ? "border-[#F17922] bg-orange-50"
                  : "border-gray-200 bg-white hover:border-[#F17922]/40 hover:bg-gray-50"
              }`}
            >
              <Icon className={`w-5 h-5 shrink-0 ${selected ? "text-[#F17922]" : "text-gray-400"}`} />
              <span className="min-w-0">
                <span className={`block text-[13px] font-semibold ${selected ? "text-[#F17922]" : "text-gray-700"}`}>
                  {o.label}
                </span>
                <span className="block text-[11px] text-gray-500 truncate">{o.desc}</span>
              </span>
            </button>
          );
        })}
      </div>

      {/*
        Dire ce que le clic déclenche AVANT le clic. La bascule vers le call
        center n'est pas qu'une étiquette : elle aligne la commande sur les
        règles de la saisie au backoffice, et le total change sous les yeux de
        l'agent. Découvrir ça après coup, sur une commande qu'on vient de
        confirmer au client au téléphone, est le meilleur moyen de ne plus
        faire confiance à l'écran.

        Le paiement surtout : une commande reprise et encore à régler n'est
        plus payée dans l'application, c'est la caisse qui l'encaisse. L'agent
        doit pouvoir le dire au client au téléphone.
      */}
      {etaitAuto && (
        <p className="mt-2 text-[11px] leading-relaxed text-gray-500">
          {montantFige === null ? (
            <>
              Passer au call center met la <strong className="font-semibold">taxe à zéro</strong>, comme pour
              toute commande saisie au backoffice, et recalcule le total.
            </>
          ) : (
            <>
              Passer au call center ne change <strong className="font-semibold">ni la taxe ni le total</strong> :{" "}
              {montantFige === "payee"
                ? "la commande est déjà payée."
                : "la livraison est déjà lancée avec ce montant à encaisser."}
            </>
          )}
          {paiementApresBascule === "caisse" && (
            <>
              {" "}Le client ne paiera plus dans l&apos;application :{" "}
              <strong className="font-semibold">la caisse encaissera ce qui reste à payer</strong>, au
              restaurant ou à la livraison.
            </>
          )}
          {paiementApresBascule === "livreur" &&
            " L'encaissement déclaré par le livreur reste à confirmer dans l'onglet Paiement."}
          {enAttente && " La commande, encore en attente, passera aussi en « acceptée »."}
        </p>
      )}

      {brouillon && !auto && (
        <p className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[12px] leading-relaxed text-amber-900">
          Commande reprise au téléphone : le client paiera au restaurant ou à la livraison.{" "}
          <strong className="font-semibold">S&apos;il paie aussi dans l&apos;application, il paiera deux fois.</strong>
        </p>
      )}
      {brouillon && auto && (
        <p className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[12px] leading-relaxed text-amber-900">
          Pour reprendre la commande au téléphone, choisissez Call center. Sinon, elle reste un panier non payé
          que le restaurant ne voit pas.
        </p>
      )}
    </div>
  );
};

export default OrigineSelector;
