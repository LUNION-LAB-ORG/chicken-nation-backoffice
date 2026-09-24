import React from "react";
import { fmtNombre, fmtPct } from "../../utils/crm-ui";

/**
 * Barres horizontales simples (raisons, statuts, offres) : plus lisibles
 * qu'un camembert quand les libellés sont longs.
 */
export function BarresRepartition({
  lignes,
  vide = "Rien à afficher pour l'instant.",
  couleur = "#F17922",
}: {
  lignes: { label: string; nombre: number; part?: number; accent?: boolean }[];
  vide?: string;
  couleur?: string;
}) {
  const max = Math.max(1, ...lignes.map((l) => l.nombre));
  if (lignes.length === 0) return <p className="text-sm text-gray-400 py-6 text-center">{vide}</p>;

  return (
    <ul className="space-y-2.5">
      {lignes.map((l) => (
        <li key={l.label}>
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className={`truncate ${l.accent ? "font-semibold text-gray-900" : "text-gray-700"}`}>{l.label}</span>
            <span className="tabular-nums text-gray-600 whitespace-nowrap">
              {fmtNombre(l.nombre)}
              {l.part != null && <span className="text-xs text-gray-400"> · {fmtPct(l.part)}</span>}
            </span>
          </div>
          <div className="h-2 rounded-full bg-gray-100 mt-1 overflow-hidden">
            <div
              className="h-full rounded-full"
              style={{ width: `${Math.round((l.nombre / max) * 100)}%`, backgroundColor: couleur, opacity: l.accent === false ? 0.45 : 1 }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
