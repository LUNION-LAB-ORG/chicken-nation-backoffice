import React from "react";
import { IProspectLigne } from "../../types/prospect.type";
import { CarteProspect } from "./CarteProspect";
import { LigneProspect } from "./LigneProspect";

const COLONNES = ["Prospect", "Inscrit", "Statut", "Agent", "Dernier appel", "Raison", "Coupon", "Campagne"];

export function TableProspects({
  lignes,
  selection,
  onBasculer,
  onBasculerPage,
  onOuvrir,
  selectionnable,
}: {
  lignes: IProspectLigne[];
  selection: Set<string>;
  onBasculer: (id: string) => void;
  onBasculerPage: () => void;
  onOuvrir: (id: string) => void;
  selectionnable: boolean;
}) {
  const toutePage = lignes.length > 0 && lignes.every((l) => selection.has(l.id));

  return (
    <>
      <div className="md:hidden space-y-2">
        {lignes.map((p) => (
          <CarteProspect
            key={p.id}
            p={p}
            coche={selection.has(p.id)}
            onCocher={() => onBasculer(p.id)}
            onOuvrir={() => onOuvrir(p.id)}
            selectionnable={selectionnable}
          />
        ))}
      </div>
      <div className="hidden md:block bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-xs uppercase">
                {selectionnable && (
                  <th className="w-10 px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={toutePage}
                      onChange={onBasculerPage}
                      className="w-4 h-4 accent-[#F17922]"
                      aria-label="Sélectionner toute la page"
                    />
                  </th>
                )}
                {COLONNES.map((c) => (
                  <th key={c} className="text-left font-semibold px-4 py-3 whitespace-nowrap">
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {lignes.map((p) => (
                <LigneProspect
                  key={p.id}
                  p={p}
                  coche={selection.has(p.id)}
                  onCocher={() => onBasculer(p.id)}
                  onOuvrir={() => onOuvrir(p.id)}
                  selectionnable={selectionnable}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
