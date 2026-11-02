import React from "react";
import type { CompteursAvis } from "../../types/avis-prive.types";
import { COMPTEURS, type CleCompteur } from "../../utils/avis-prive";

/**
 * Les quatre compteurs du haut de la liste. Un clic filtre la liste sur ce
 * que le chiffre compte ; « Échéance dépassée » est bordé de rouge.
 */
export function CompteursRetours({
  compteurs,
  onChoisir,
}: {
  compteurs: CompteursAvis | undefined;
  onChoisir: (cle: CleCompteur) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {COMPTEURS.map(({ cle, libelle }) => {
        const alerte = cle === "echeance_depassee";
        const valeur = compteurs?.[cle];
        return (
          <button
            key={cle}
            type="button"
            onClick={() => onChoisir(cle)}
            className={`rounded-xl bg-white px-4 py-3 text-left transition-colors hover:bg-orange-50/40 focus:outline-none focus:ring-2 focus:ring-orange-100 ${
              alerte ? "border-2 border-[#C2410C]" : "border border-slate-100"
            }`}
          >
            <div className={`text-[13px] ${alerte ? "font-semibold text-[#9A3412]" : "text-gray-500"}`}>{libelle}</div>
            <div className={`text-2xl font-bold ${alerte ? "text-[#9A3412]" : "text-gray-900"}`}>
              {valeur === undefined ? "…" : valeur}
            </div>
          </button>
        );
      })}
    </div>
  );
}
