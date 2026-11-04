"use client";

import React, { useState } from "react";
import { HandCoins, LayoutDashboard, SlidersHorizontal, UserPlus, Users } from "lucide-react";
import DashboardPageHeader from "@/components/ui/DashboardPageHeader";
import StatsPeriodFilter from "@/components/gestion/Statistiques/shared/StatsPeriodFilter";
import { useDashboardStore } from "@/store/dashboardStore";
import AmbassadorPayoutModal from "../../../../features/referral/components/AmbassadorPayoutModal";
import AmbassadorsList from "../../../../features/referral/components/AmbassadorsList";
import FilleulsList from "../../../../features/referral/components/FilleulsList";
import GainsList from "../../../../features/referral/components/GainsList";
import ReferralTableau from "../../../../features/referral/components/ReferralTableau";
import { VueReferral } from "../../../../features/referral/components/vues";
import { Onglet, Onglets } from "../../../../features/crm/components/commun/Onglets";
import { StatsFilters } from "../../../../features/statistics/filters/statistics.filters";
import { useAuthStore } from "../../../../features/users/hook/authStore";
import { Action, Modules } from "../../../../features/users/types/auth.type";

type Cle = VueReferral["onglet"];

const ONGLETS: Onglet<Cle>[] = [
  { cle: "tableau", label: "Tableau de bord", Icone: LayoutDashboard },
  { cle: "parrains", label: "Ambassadeurs", Icone: Users },
  { cle: "filleuls", label: "Filleuls", Icone: UserPlus },
  { cle: "gains", label: "Gains", Icone: HandCoins },
];

/**
 * Module « Parrainage » (menu Fidélisation) : un onglet de chiffres et un
 * onglet par liste (parrains, filleuls, gains), sur la même période. La
 * CONFIGURATION (cadeau du filleul, prime, commission) vit dans
 * Paramètres → Parrainage.
 */
export default function ReferralModule() {
  const { setActiveTab } = useDashboardStore();
  // La configuration vit dans Paramètres : sans SETTINGS READ, ni le bouton ni
  // le renvoi vers Paramètres n'ont de sens.
  const peutParametrer = useAuthStore((s) => s.can(Modules.SETTINGS, Action.READ));

  // Tout le programme par défaut : sur un seul mois, la plupart des parrains seraient à zéro.
  const [filtres, setFiltres] = useState<StatsFilters>({});
  const [vue, setVue] = useState<VueReferral>({ onglet: "tableau" });
  const [ficheId, setFicheId] = useState<string | null>(null);

  return (
    <div className="flex-1 overflow-auto p-4 space-y-4">
      <div className="-mt-10">
        <DashboardPageHeader
          mode="list"
          title="Parrainage"
          actions={
            peutParametrer
              ? [
                  {
                    label: "Configurer le programme",
                    onClick: () => setActiveTab("settings"),
                  },
                ]
              : []
          }
        />
      </div>

      {peutParametrer && (
        <div className="flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-500">
          <SlidersHorizontal className="h-4 w-4 shrink-0 text-[#F17922]" />
          Cadeau du filleul, prime et commission se règlent dans
          <span className="font-medium text-slate-700">Paramètres → Parrainage</span>.
        </div>
      )}

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="min-w-0 max-w-full">
          <Onglets<Cle>
            onglets={ONGLETS}
            actif={vue.onglet}
            onChange={(onglet) => setVue({ onglet })}
          />
        </div>
        <StatsPeriodFilter filters={filtres} onChange={setFiltres} avecTout />
      </div>

      {vue.onglet === "tableau" && <ReferralTableau filtres={filtres} onVoir={setVue} />}
      {vue.onglet === "parrains" && (
        <AmbassadorsList
          filtres={filtres}
          etatInitial={vue.etat}
          triInitial={vue.tri}
          onOuvrirFiche={setFicheId}
        />
      )}
      {vue.onglet === "filleuls" && (
        <FilleulsList filtres={filtres} etatInitial={vue.etat} onOuvrirFiche={setFicheId} />
      )}
      {vue.onglet === "gains" && (
        <GainsList filtres={filtres} statutInitial={vue.statut} onOuvrirFiche={setFicheId} />
      )}

      <AmbassadorPayoutModal
        key={ficheId ?? "aucun"}
        ambassadorId={ficheId}
        isOpen={ficheId !== null}
        onClose={() => setFicheId(null)}
      />
    </div>
  );
}
