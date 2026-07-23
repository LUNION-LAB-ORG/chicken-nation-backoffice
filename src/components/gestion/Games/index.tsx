"use client";

import React, { useState } from "react";
import { Dices, Layers } from "lucide-react";
import DashboardPageHeader from "@/components/ui/DashboardPageHeader";
import ScratchGameManager from "../../../../features/scratch_game/components/ScratchGameManager";
import ComboGameManager from "../../../../features/combo/components/ComboGameManager";

type GameTab = "scratch" | "combo";

const TABS: { key: GameTab; label: string; icon: React.ElementType }[] = [
  { key: "scratch", label: "Gratte & Gagne", icon: Layers },
  { key: "combo", label: "Combo Mystère", icon: Dices },
];

/**
 * Module « Jeux » (menu Fidélisation) : les mécaniques ludiques — Gratte &
 * Gagne (lots, simulateur, enveloppe) et Combo Mystère.
 */
export default function GamesModule() {
  const [tab, setTab] = useState<GameTab>("scratch");

  return (
    <div className="flex-1 overflow-auto p-4 space-y-4">
      <div className="-mt-10">
        <DashboardPageHeader mode="list" title="Jeux" />
      </div>

      <div className="flex gap-2">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              tab === key
                ? "bg-[#F17922] text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {tab === "scratch" ? <ScratchGameManager /> : <ComboGameManager />}
    </div>
  );
}
