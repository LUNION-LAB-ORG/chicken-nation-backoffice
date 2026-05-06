"use client";

import React from "react";
import { Map } from "lucide-react";

import type { DelivererStatus } from "../../../../features/livreurs/types/livreur.types";

// "CARTE_LIVE" est une tab virtuelle (pas un statut DB) — affiche la carte live.
// "PLANNING" est désormais une sous-page dédiée dans la sidebar.
export type LivreursTab = "TOUS" | DelivererStatus | "CARTE_LIVE";

interface ITabConfig {
  key: LivreursTab;
  label: string;
  /** Icône optionnelle pour les tabs virtuelles (Carte live). */
  Icon?: React.FC<{ className?: string }>;
}

export const LIVREURS_TABS: ITabConfig[] = [
  { key: "TOUS", label: "Tous" },
  { key: "PENDING_VALIDATION", label: "En attente" },
  { key: "ACTIVE", label: "Actifs" },
  { key: "SUSPENDED", label: "Suspendus" },
  { key: "REJECTED", label: "Refusés" },
  { key: "CARTE_LIVE", label: "Carte live", Icon: Map },
];

interface LivreursTabsProps {
  selected: LivreursTab;
  onSelect: (tab: LivreursTab) => void;
  counts?: Partial<Record<LivreursTab, number>>;
}

const LivreursTabs: React.FC<LivreursTabsProps> = ({ selected, onSelect, counts }) => (
  <div
    className="flex items-center bg-[#f4f4f5] rounded-[12px] px-2 mb-4 w-fit overflow-x-auto scrollbar-thin scrollbar-thumb-[#E4E4E7] scrollbar-track-transparent"
    style={{ minHeight: 40 }}
  >
    {LIVREURS_TABS.map((tab, idx) => {
      const count = counts?.[tab.key];
      const isActive = selected === tab.key;
      return (
        <button
          key={tab.key}
          type="button"
          onClick={() => onSelect(tab.key)}
          className={`transition-colors font-bold cursor-pointer text-[11px] lg:text-[14px] px-5 py-1 rounded-[12px] focus:outline-none whitespace-nowrap inline-flex items-center gap-1.5
            ${isActive ? "bg-[#F17922] text-white shadow-none" : "bg-transparent text-[#71717A] font-normal"}
            ${idx === 0 ? "" : "ml-1"}
          `}
          style={{ minWidth: 75, height: 30 }}
        >
          {tab.Icon && <tab.Icon className="w-3.5 h-3.5" />}
          {tab.label}
          {typeof count === "number" && (
            <span className={`ml-1 ${isActive ? "text-white/80" : "text-[#A1A1AA]"}`}>
              ({count})
            </span>
          )}
        </button>
      );
    })}
  </div>
);

export default LivreursTabs;
