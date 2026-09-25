import React from "react";
import { Public } from "../../types/contact.type";
import { PUBLICS } from "../../utils/crm-ui";

const CAPTES: Public[] = ["GLOVO", "YANGO"];
const PASTILLE: Record<Public, string> = { JAMAIS_COMMANDE: "Inscrits", INACTIF: "Inactifs", GLOVO: "Glovo", YANGO: "Yango" };
const memes = (a: Public[], b: Public[]) => a.length === b.length && a.every((p) => b.includes(p));

/**
 * Filtre « publics » des tableaux de bord : tous, un ou plusieurs publics, et
 * le raccourci « Glovo + Yango ». Une liste vide veut dire « tous ».
 */
export function ChoixPublics({ valeur = [], onChange }: { valeur?: Public[]; onChange: (p: Public[]) => void }) {
  const basculer = (p: Public) => {
    const suivant = valeur.includes(p) ? valeur.filter((x) => x !== p) : [...valeur, p];
    // Les quatre cochés, c'est « tous ».
    onChange(suivant.length === PUBLICS.length ? [] : suivant);
  };
  const classe = (actif: boolean) =>
    `text-[13px] font-semibold px-3 py-1 rounded-lg whitespace-nowrap ${
      actif ? "bg-white text-[#F17922] shadow-sm" : "text-[#71717A] hover:text-gray-700"
    }`;
  return (
    <div className="flex flex-wrap items-center gap-1 bg-[#f4f4f5] rounded-xl p-1" role="group" aria-label="Publics">
      <button type="button" onClick={() => onChange([])} className={classe(valeur.length === 0)} aria-pressed={valeur.length === 0}>
        Tous les publics
      </button>
      {PUBLICS.map((p) => (
        <button key={p} type="button" onClick={() => basculer(p)} className={classe(valeur.includes(p))} aria-pressed={valeur.includes(p)}>
          {PASTILLE[p]}
        </button>
      ))}
      <button type="button" onClick={() => onChange(CAPTES)} className={classe(memes(valeur, CAPTES))} aria-pressed={memes(valeur, CAPTES)}>
        Glovo + Yango
      </button>
    </div>
  );
}
