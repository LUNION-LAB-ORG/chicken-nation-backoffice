"use client";

import React from "react";
import { Headset, Smartphone, type LucideIcon } from "lucide-react";

interface OrigineSelectorProps {
  /** `true` = commande de l'application, `false` = saisie par le personnel. */
  auto: boolean;
  onChange: (auto: boolean) => void;
  /** Le passage vers « Application » est refusé tant que la commande attend. */
  enAttente?: boolean;
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
const OrigineSelector: React.FC<OrigineSelectorProps> = ({ auto, onChange, enAttente = false }) => {
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
      */}
      {auto && (
        <p className="mt-2 text-[11px] leading-relaxed text-gray-500">
          Passer au call center met la <strong className="font-semibold">taxe à zéro</strong>, comme pour
          toute commande saisie au backoffice, et recalcule le total.
          {enAttente && " La commande, encore en attente, passera aussi en « acceptée »."}
        </p>
      )}
    </div>
  );
};

export default OrigineSelector;
