"use client";

import React from "react";

export interface OngletParametres {
  key: string;
  label: string;
}

export interface GroupeParametres {
  key: string;
  label: string;
  /** Icône lucide-react du groupe. */
  Icon: React.FC<{ className?: string }>;
  /** Ce que le groupe règle, en une ligne, sous la barre. */
  description: string;
  onglets: OngletParametres[];
}

interface SettingsTabsProps {
  groupes: GroupeParametres[];
  /** Clé de l'onglet affiché. */
  selected: string;
  onSelect: (key: string) => void;
}

/**
 * NAVIGATION DES PARAMÈTRES, À DEUX NIVEAUX (26/11).
 *
 * Avant : treize onglets sur une seule ligne, qui se chevauchaient dès que la
 * fenêtre rétrécissait. Désormais les réglages sont rangés par groupe (Vente,
 * Livraison, Fidélité...) ; les onglets du groupe choisi s'affichent dessous.
 * Les deux rangées passent à la ligne quand la largeur manque : rien n'est
 * écrasé ni caché, du téléphone au grand écran.
 */
const SettingsTabs: React.FC<SettingsTabsProps> = ({ groupes, selected, onSelect }) => {
  const groupe = groupes.find((g) => g.onglets.some((o) => o.key === selected)) ?? groupes[0];
  if (!groupe) return null;

  return (
    <nav aria-label="Paramètres" className="bg-white border border-gray-200 rounded-2xl p-3 sm:p-4 min-w-0">
      {/* Groupes */}
      <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Groupes de réglages">
        {groupes.map((g) => {
          const actif = g.key === groupe.key;
          return (
            <button
              key={g.key}
              type="button"
              role="tab"
              aria-selected={actif}
              onClick={() => onSelect(g.onglets[0].key)}
              className={`shrink-0 inline-flex items-center gap-2 h-9 px-3.5 rounded-xl text-[13px] whitespace-nowrap cursor-pointer transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 ${
                actif
                  ? "bg-[#F17922] text-blanc font-bold"
                  : "bg-hex-f4f4f5 text-hex-71717a font-medium hover:text-gray-900"
              }`}
            >
              <g.Icon className="w-4 h-4" />
              {g.label}
            </button>
          );
        })}
      </div>

      <p className="mt-3 text-xs text-gray-500">{groupe.description}</p>

      {/* Onglets du groupe (inutile quand il n'en a qu'un) */}
      {groupe.onglets.length > 1 && (
        <div
          className="mt-2 flex flex-wrap gap-x-5 gap-y-1 border-b border-gray-200"
          role="tablist"
          aria-label={groupe.label}
        >
          {groupe.onglets.map((o) => {
            const actif = o.key === selected;
            return (
              <button
                key={o.key}
                type="button"
                role="tab"
                aria-selected={actif}
                onClick={() => onSelect(o.key)}
                className={`shrink-0 -mb-px py-2 text-sm whitespace-nowrap border-b-2 cursor-pointer transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 ${
                  actif
                    ? "border-[#F17922] text-[#F17922] font-bold"
                    : "border-transparent text-gray-500 font-medium hover:text-gray-900"
                }`}
              >
                {o.label}
              </button>
            );
          })}
        </div>
      )}
    </nav>
  );
};

export default SettingsTabs;
