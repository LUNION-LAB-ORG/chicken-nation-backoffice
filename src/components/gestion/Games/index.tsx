"use client";

import React, { useState } from "react";
import { Dices, Layers } from "lucide-react";
import DashboardPageHeader from "@/components/ui/DashboardPageHeader";
import ScratchGameManager from "../../../../features/scratch_game/components/ScratchGameManager";
import ComboGameManager from "../../../../features/combo/components/ComboGameManager";

type GameTab = "scratch" | "combo";

const TABS: {
  key: GameTab;
  label: string;
  icon: React.ElementType;
  desc: string;
}[] = [
  {
    key: "scratch",
    label: "Gratte & Gagne",
    icon: Layers,
    desc: "Ce que le client découvre en grattant sa carte, après une commande payée.",
  },
  {
    key: "combo",
    label: "Combo Mystère",
    icon: Dices,
    desc: "Un menu à deviner sur une période ; les bonnes réponses entrent au tirage.",
  },
];

/**
 * Module « Jeux » (menu Fidélisation) : les deux mécaniques ludiques, chacune
 * avec son propre pilotage. L'onglet actif rappelle en une phrase ce que le
 * jeu fait — sans quoi « Lots », « Enveloppe » ou « Tirage » restent opaques.
 */
export default function GamesModule() {
  const [tab, setTab] = useState<GameTab>("scratch");
  const active = TABS.find((t) => t.key === tab)!;

  return (
    <div className="flex-1 overflow-auto p-4 space-y-5">
      <div className="-mt-10">
        <DashboardPageHeader mode="list" title="Jeux" />
      </div>

      {/* Sélecteur de jeu : deux cartes explicites plutôt que deux pilules muettes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {TABS.map(({ key, label, icon: Icon, desc }) => {
          const isActive = tab === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={`text-left rounded-xl border p-4 transition-all cursor-pointer ${
                isActive
                  ? "border-[#F17922] bg-[#FFF9F4] shadow-sm"
                  : "border-[#E4E4E7] bg-white hover:border-[#F17922]/40"
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                    isActive ? "bg-[#F17922]" : "bg-[#F4F4F5]"
                  }`}
                >
                  <Icon size={20} className={isActive ? "text-white" : "text-[#9796A1]"} />
                </div>
                <div className="min-w-0">
                  <div
                    className={`text-[15px] font-semibold ${
                      isActive ? "text-[#F17922]" : "text-[#18181B]"
                    }`}
                  >
                    {label}
                  </div>
                  <p className="text-xs text-[#9796A1] mt-1 leading-relaxed">{desc}</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <section aria-label={active.label}>
        {tab === "scratch" ? <ScratchGameManager /> : <ComboGameManager />}
      </section>
    </div>
  );
}
