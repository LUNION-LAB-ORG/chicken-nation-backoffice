"use client";

import React, { useState } from "react";
import { Settings2, Users } from "lucide-react";
import ReferralConfigForm from "./ReferralConfigForm";
import AmbassadorsList from "./AmbassadorsList";

type SubTab = "config" | "ambassadors";

const tabs: { key: SubTab; label: string; icon: React.ElementType }[] = [
  { key: "config", label: "Configuration", icon: Settings2 },
  { key: "ambassadors", label: "Ambassadeurs", icon: Users },
];

/**
 * Écran Parrainage (module Fidélité). Deux volets :
 *  - Configuration : bons filleul/parrain + réglages monétaires ambassadeur.
 *  - Ambassadeurs : liste des parrains rémunérés + gestion des versements.
 */
export default function ReferralPanel() {
  const [tab, setTab] = useState<SubTab>("config");

  return (
    <div className="space-y-6">
      <div className="inline-flex items-center gap-1 bg-[#F4F4F5] rounded-xl p-1">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer " +
              (tab === key
                ? "bg-white text-[#F17922] shadow-sm"
                : "text-[#71717A] hover:text-[#18181B]")
            }
          >
            <Icon size={16} /> {label}
          </button>
        ))}
      </div>

      {tab === "config" ? <ReferralConfigForm /> : <AmbassadorsList />}
    </div>
  );
}
