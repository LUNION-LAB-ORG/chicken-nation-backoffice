"use client";

import React from "react";
import { SlidersHorizontal } from "lucide-react";
import DashboardPageHeader from "@/components/ui/DashboardPageHeader";
import { useDashboardStore } from "@/store/dashboardStore";
import AmbassadorsList from "../../../../features/referral/components/AmbassadorsList";

/**
 * Module « Parrainage » (menu Fidélisation) — vue OPÉRATIONNELLE : ambassadeurs,
 * gains, versements. La CONFIGURATION du programme (cadeaux filleul/parrain,
 * primes, commissions, bon de bienvenue) vit dans Paramètres → Parrainage.
 */
export default function ReferralModule() {
  const { setActiveTab } = useDashboardStore();

  return (
    <div className="flex-1 overflow-auto p-4 space-y-4">
      <div className="-mt-10">
        <DashboardPageHeader
          mode="list"
          title="Parrainage"
          actions={[
            {
              label: "Configurer le programme",
              onClick: () => setActiveTab("settings"),
            },
          ]}
        />
      </div>

      <div className="flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-500">
        <SlidersHorizontal className="h-4 w-4 shrink-0 text-[#F17922]" />
        Cadeaux filleul/parrain, primes et commissions se règlent dans
        <span className="font-medium text-slate-700">Paramètres → Parrainage</span>.
      </div>

      <AmbassadorsList />
    </div>
  );
}
