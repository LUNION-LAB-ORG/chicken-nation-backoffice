import React from "react";
import DashboardPageHeader from "@/components/ui/DashboardPageHeader";
import { GenericStatCard } from "@/components/gestion/Dashboard/GenericStatCard";
import AppClickListTable from "@/components/gestion/Marketing/app-click-list-table";
import { DeeplinkTypeBreakdown } from "@/components/gestion/Marketing/DeeplinkTypeBreakdown";
import { useAnalyticsStats } from "../../../../features/analytics/hooks/useAnalyticsStats";

function MarketingModule() {
  const { data, isLoading } = useAnalyticsStats();

  return (
    <div className="flex-1 overflow-auto p-4 space-y-6">
      <div className="-mt-10">
        <DashboardPageHeader
          mode="list"
          title="Clics & Deeplinks"
          subtitle="Suivi des clics d'ouverture de l'application et de ce qui est ciblé"
        />
      </div>

      {/* Indicateurs clés */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <GenericStatCard
          title={`${(data?.total.allTime || 0).toLocaleString()} clic(s) au total`}
          value={`${(data?.total.currentMonth || 0).toLocaleString()}`}
          badgeText={"Clics du mois"}
          badgeColor="#EA4335"
        />
        <GenericStatCard
          title="Sur les dernières 24h"
          value={data?.total.last24Hours || 0}
          badgeText={"24h"}
          badgeColor="#4285F4"
        />
        <GenericStatCard
          title={`${(data?.ios.allTime || 0).toLocaleString()} clic(s) iOS au total`}
          value={data?.ios.currentMonth || 0}
          badgeText={"iOS ce mois"}
          badgeColor="#FF6D01"
        />
        <GenericStatCard
          title={`${(data?.android.allTime || 0).toLocaleString()} clic(s) Android au total`}
          value={data?.android.currentMonth || 0}
          badgeText={"Android ce mois"}
          badgeColor="#34A853"
        />
      </div>

      {/* Répartition par type — l'info de décision */}
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
