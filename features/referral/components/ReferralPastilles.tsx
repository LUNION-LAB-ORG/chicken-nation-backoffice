"use client";

import React from "react";
import { nombre } from "../utils/format";

export interface Pastille<V extends string> {
  valeur: V | null;
  label: string;
  nombre?: number;
}

/** Filtre en pastilles, chacune avec son nombre de lignes. */
export default function ReferralPastilles<V extends string>({
  pastilles,
  valeur,
  onChange,
}: {
  pastilles: Pastille<V>[];
  valeur: V | null;
  onChange: (valeur: V | null) => void;
}) {
  return (
    <div className="max-w-full overflow-x-auto">
      <div className="flex items-center gap-1 bg-[#f4f4f5] rounded-xl p-1 w-fit min-w-max">
        {pastilles.map((p) => {
          const choisie = p.valeur === valeur;
          return (
            <button
              key={p.valeur ?? "tous"}
              type="button"
              onClick={() => onChange(p.valeur)}
              className={`text-[13px] font-semibold px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
                choisie ? "bg-[#F17922] text-white" : "text-[#71717A] hover:text-gray-700"
              }`}
            >
              {p.label}
              {p.nombre !== undefined && (
                <span className={`ml-1.5 text-[12px] font-medium ${choisie ? "text-white/80" : "text-[#9796A1]"}`}>
                  {nombre(p.nombre)}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
