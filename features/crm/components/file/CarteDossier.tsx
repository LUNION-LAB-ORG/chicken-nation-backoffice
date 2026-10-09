import React from "react";
import { ChevronRight, Megaphone, Store, Users } from "lucide-react";
import { fmtNombre } from "../../utils/crm-ui";
import type { Dossier } from "../../utils/dossiers-file";

const ICONE = { campagne: Megaphone, commune: Store, "sans-campagne": Users } as const;

const AIDE = {
  campagne: "Vos contacts de cette campagne.",
  commune: "Relevés en caisse, le premier agent qui appelle prend le client.",
  "sans-campagne": "Contacts qui vous sont confiés hors de toute campagne.",
} as const;

/**
 * Un dossier de la file, vu de l'accueil.
 *
 * Les deux nombres mis en avant sont ceux qui DESCENDENT quand l'agent
 * travaille : jamais appelés, et à relancer. Le total, lui, est un stock qui
 * ne bouge qu'à la conversion ou au refus : l'afficher seul donnait le
 * sentiment d'une file qui n'avance pas.
 */
export function CarteDossier({ dossier, onOuvrir }: { dossier: Dossier; onOuvrir: () => void }) {
  const Icone = ICONE[dossier.genre];
  const aFaire = dossier.jamais_appeles + dossier.a_relancer;

  return (
    <button
      type="button"
      onClick={onOuvrir}
      className="w-full text-left bg-white border border-gray-200 rounded-xl p-4 hover:border-[#F17922]/50 hover:bg-orange-50/40 transition"
    >
      <div className="flex items-start gap-3">
        <span className="w-9 h-9 rounded-lg bg-orange-50 flex items-center justify-center shrink-0">
          <Icone className="w-4 h-4 text-[#F17922]" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold text-gray-900 truncate">{dossier.nom}</span>
          <span className="block text-xs text-gray-500">{AIDE[dossier.genre]}</span>
        </span>
        <ChevronRight className="w-4 h-4 text-gray-400 shrink-0 mt-2" />
      </div>

      <div className="mt-3 flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <span className="text-2xl font-bold text-[#F17922] tabular-nums">{fmtNombre(aFaire)}</span>
        <span className="text-xs text-gray-500">
          à appeler
          {dossier.a_relancer > 0 && (
            <span className="text-gray-400">
              {" "}· dont {fmtNombre(dossier.a_relancer)} à relancer
            </span>
          )}
        </span>
        <span className="ml-auto text-[11px] text-gray-400 tabular-nums">
          {fmtNombre(dossier.total)} au total
          {dossier.interesses > 0 && ` · ${fmtNombre(dossier.interesses)} intéressés`}
        </span>
      </div>
    </button>
  );
}
