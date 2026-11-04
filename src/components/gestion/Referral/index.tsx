"use client";

import React, { useRef, useState } from "react";
import { HandCoins, SlidersHorizontal, UserPlus, Users } from "lucide-react";
import DashboardPageHeader from "@/components/ui/DashboardPageHeader";
import { useDashboardStore } from "@/store/dashboardStore";
import AmbassadorPayoutModal from "../../../../features/referral/components/AmbassadorPayoutModal";
import AmbassadorsList from "../../../../features/referral/components/AmbassadorsList";
import FilleulsList from "../../../../features/referral/components/FilleulsList";
import GainsList from "../../../../features/referral/components/GainsList";
import ReferralTableau from "../../../../features/referral/components/ReferralTableau";
import { VueListe } from "../../../../features/referral/components/vues";
import { Onglet, Onglets } from "../../../../features/crm/components/commun/Onglets";
import { StatsFilters } from "../../../../features/statistics/filters/statistics.filters";
import { useAuthStore } from "../../../../features/users/hook/authStore";
import { Action, Modules } from "../../../../features/users/types/auth.type";

type Cle = VueListe["onglet"];

const ONGLETS: Onglet<Cle>[] = [
  { cle: "parrains", label: "Ambassadeurs", Icone: Users },
  { cle: "filleuls", label: "Filleuls", Icone: UserPlus },
  { cle: "gains", label: "Gains", Icone: HandCoins },
];

/**
 * Module « Parrainage » (menu Fidélisation) : chiffres du programme, puis
 * parrains, filleuls et gains filtrés sur la même période. La CONFIGURATION
 * (cadeau du filleul, prime, commission) vit dans Paramètres → Parrainage.
 */
export default function ReferralModule() {
  const { setActiveTab } = useDashboardStore();
  // La configuration vit dans Paramètres : sans SETTINGS READ, ni le bouton ni
  // le renvoi vers Paramètres n'ont de sens.
  const peutParametrer = useAuthStore((s) => s.can(Modules.SETTINGS, Action.READ));

  // Tout le programme par défaut : sur un seul mois, la plupart des parrains seraient à zéro.
  const [filtres, setFiltres] = useState<StatsFilters>({});
  const [vue, setVue] = useState<VueListe>({ onglet: "parrains" });
  // Une carte cliquée repart de son filtre : la liste est remontée.
  const [cleVue, setCleVue] = useState(0);
  const [ficheId, setFicheId] = useState<string | null>(null);
  const listes = useRef<HTMLDivElement>(null);

  const voir = (suivante: VueListe) => {
    setVue(suivante);
    setCleVue((c) => c + 1);
    listes.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

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

      <ReferralTableau filtres={filtres} onChangeFiltres={setFiltres} onVoir={voir} />

      <div ref={listes} className="space-y-4 pt-2 scroll-mt-2">
        <Onglets<Cle>
          onglets={ONGLETS}
          actif={vue.onglet}
          onChange={(onglet) => setVue({ onglet })}
        />

        {vue.onglet === "parrains" && (
          <AmbassadorsList
            key={cleVue}
            filtres={filtres}
            etatInitial={vue.etat}
            triInitial={vue.tri}
            onOuvrirFiche={setFicheId}
          />
        )}
        {vue.onglet === "filleuls" && (
          <FilleulsList
            key={cleVue}
            filtres={filtres}
            etatInitial={vue.etat}
            onOuvrirFiche={setFicheId}
          />
        )}
        {vue.onglet === "gains" && (
          <GainsList
            key={cleVue}
            filtres={filtres}
            statutInitial={vue.statut}
            onOuvrirFiche={setFicheId}
          />
        )}
      </div>

      <AmbassadorPayoutModal
        key={ficheId ?? "aucun"}
        ambassadorId={ficheId}
        isOpen={ficheId !== null}
        onClose={() => setFicheId(null)}
      />
    </div>
  );
}
