import React from "react";
import { GenericStatCard } from "@/components/gestion/Dashboard/GenericStatCard";
import AppClickListTable from "@/components/gestion/Marketing/app-click-list-table";
import { useAnalyticsStats } from "../../../../features/analytics/hooks/useAnalyticsStats";

function MarketingModule() {
  const { data } = useAnalyticsStats();

  return (
    <div className="flex-1 overflow-auto p-4">
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        <GenericStatCard
          title={`${data?.total.allTime || 0} clic(s) au total`}
          value={`${data?.total.currentMonth || 0}`}
          badgeText={"Clics du mois"}
          badgeColor="#EA4335"
        />
        <GenericStatCard
          title="Clics (24h)"
          value={data?.total.last24Hours || 0}
          badgeText={"24h"}
          badgeColor="#4285F4"
        />
        <GenericStatCard
          title={`${data?.ios.allTime || 0} clic(s) Apple au total`}
          value={data?.ios.allTime || 0}
          badgeText={"Clics Apple du mois"}
          badgeColor="#FF6D01"
        />
        <GenericStatCard
          title={`${data?.android.allTime || 0} clic(s) Android au total`}
          value={data?.android.allTime || 0}
          badgeText={"Clics Android du mois"}
          badgeColor="#34A853"
        />
        <AppClickListTable />
      </div>
    </div>
  );
}

export default MarketingModule;
