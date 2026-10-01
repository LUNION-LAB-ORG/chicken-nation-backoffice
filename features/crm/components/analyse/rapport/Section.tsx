import React from "react";
import StatsChartCard from "@/components/gestion/Statistiques/shared/StatsChartCard";

/**
 * Une section du rapport : la carte des statistiques, coiffée d'une bande
 * de la couleur du levier (celle du public dans tout le CRM ; orange pour
 * l'équipe et le résultat). La même bande est dans le PDF.
 */
export function Section({
  titre,
  sousTitre,
  couleur,
  droite,
  children,
}: {
  titre: string;
  sousTitre?: string;
  couleur: string;
  droite?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-2xl shadow-sm">
      <div className="h-1.5" style={{ backgroundColor: couleur }} aria-hidden />
      <StatsChartCard title={titre} subtitle={sousTitre} rightContent={droite} className="rounded-t-none border-t-0 shadow-none">
        <div className="space-y-5">{children}</div>
      </StatsChartCard>
    </section>
  );
}

/** Un public exclu par le filtre : la section reste à sa place, grisée. */
export function SectionHorsFiltre({ titre, couleur }: { titre: string; couleur: string }) {
  return (
    <section className="flex items-center gap-3 rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-5 py-3">
      <span className="h-2.5 w-2.5 shrink-0 rounded-full opacity-40" style={{ backgroundColor: couleur }} aria-hidden />
      <p className="text-sm text-gray-500">
        <span className="font-semibold text-gray-600">{titre}</span> : hors du filtre choisi.
      </p>
    </section>
  );
}

/** Colonne d'un tableau du rapport. */
export interface Colonne<T> {
  titre: string;
  /** Les nombres s'alignent à droite ; le texte à gauche. */
  droite?: boolean;
  rendu: (ligne: T) => React.ReactNode;
  className?: string;
}

/**
 * Tableau du rapport : en-tête sur fond gris clair, lignes alternées,
 * nombres à droite, défilement horizontal sur téléphone. Un texte long est
 * tronqué dans sa colonne.
 */
export function Tableau<T>({
  colonnes,
  lignes,
  cle,
  vide,
  minLargeur = 520,
}: {
  colonnes: Colonne<T>[];
  lignes: T[];
  cle: (ligne: T) => string;
  vide: string;
  minLargeur?: number;
}) {
  if (lignes.length === 0) return <p className="py-6 text-center text-sm text-gray-400">{vide}</p>;
  return (
    <div className="-mx-5 overflow-x-auto px-5">
      <table className="w-full text-sm" style={{ minWidth: minLargeur }}>
        <thead>
          <tr className="bg-gray-50 text-[11px] uppercase tracking-wide text-gray-500">
            {colonnes.map((c, i) => (
              <th
                key={c.titre}
                className={`whitespace-nowrap px-3 py-2 font-semibold ${c.droite ? "text-right" : "text-left"} ${
                  i === 0 ? "rounded-l-lg" : i === colonnes.length - 1 ? "rounded-r-lg" : ""
                }`}
              >
                {c.titre}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {lignes.map((l, i) => (
            <tr key={cle(l)} className={`border-t border-gray-100 ${i % 2 === 1 ? "bg-gray-50/50" : ""}`}>
              {colonnes.map((c) => (
                <td
                  key={c.titre}
                  className={`max-w-[240px] truncate px-3 py-2 ${c.droite ? "text-right tabular-nums" : "text-left"} ${c.className ?? ""}`}
                >
                  {c.rendu(l)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
