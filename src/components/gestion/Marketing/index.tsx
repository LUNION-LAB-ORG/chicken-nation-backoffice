import React from "react";
import DashboardPageHeader from "@/components/ui/DashboardPageHeader";
import { GenericStatCard } from "@/components/gestion/Dashboard/GenericStatCard";
import AppClickListTable from "@/components/gestion/Marketing/app-click-list-table";
import { DeeplinkTypeBreakdown } from "@/components/gestion/Marketing/DeeplinkTypeBreakdown";
import { AnalyticsFilterBar } from "@/components/gestion/Marketing/AnalyticsFilterBar";
import { useAnalyticsFilters } from "../../../../features/analytics/hooks/useAnalyticsFilters";
import { useAnalyticsStats } from "../../../../features/analytics/hooks/useAnalyticsStats";

function MarketingModule() {
  // Filtres partagés (URL) — pilotent la barre, les KPIs ET la liste.
  const { filters, changeFilters, currentSearchParams } = useAnalyticsFilters();
  // Les KPIs ne dépendent pas de la pagination → on retire page/limit pour éviter
  // un refetch inutile des stats à chaque changement de page.
  const { data, isLoading } = useAnalyticsStats({
    ...currentSearchParams,
    page: undefined,
    limit: undefined,
  });

  return (
    <div className="flex-1 overflow-auto p-4 space-y-5">
      <div className="-mt-10">
        <DashboardPageHeader
          mode="list"
          title="Clics & Deeplinks"
          subtitle="Suivi des clics d'ouverture de l'application et de ce qui est ciblé"
        />
      </div>

      {/* Barre de filtres (recherche, type, période, réinitialiser) */}
      <AnalyticsFilterBar filters={filters} changeFilters={changeFilters} />

      {/* KPIs — respectent les filtres ci-dessus */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <GenericStatCard
          title="Clics correspondants"
          value={(data?.total ?? 0).toLocaleString()}
          badgeText="Total"
          badgeColor="#EA4335"
        />
        <GenericStatCard
          title="Clics iOS"
          value={(data?.ios ?? 0).toLocaleString()}
          badgeText="iOS"
          badgeColor="#FF6D01"
        />
        <GenericStatCard
          title="Clics Android"
          value={(data?.android ?? 0).toLocaleString()}
          badgeText="Android"
          badgeColor="#34A853"
        />
        <GenericStatCard
          title="Clics Web / desktop"
          value={(data?.web ?? 0).toLocaleString()}
          badgeText="Web"
          badgeColor="#4285F4"
        />
      </div>

      {/* Répartition par type — respecte aussi les filtres */}
      <DeeplinkTypeBreakdown byType={data?.byType} isLoading={isLoading} />

      {/* Journal détaillé des clics */}
      <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden">
        <div className="px-5 pt-5">
          <h3 className="text-base font-semibold text-slate-800">
            Journal des clics
          </h3>
          <p className="text-xs text-slate-400">
            Détail par clic : type, cible, plateforme, date
          </p>
        </div>
        <AppClickListTable />
      </div>
    </div>
  );
}

export default MarketingModule;
