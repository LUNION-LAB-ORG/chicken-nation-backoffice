"use client";

import { useDashboardStore } from "@/store/dashboardStore";
import LoyaltyFilterTab from "../../../../features/points_fedelite/components/LoyaltyFilterTab";
import PointFideliteHeader from "../../../../features/points_fedelite/components/PointFideliteHeader";
import { LoyaltyPointsList } from "../../../../features/points_fedelite/components/liste-loyalty-points";
import { useLoyaltyPointsListQuery } from "../../../../features/points_fedelite/queries/loyalty.queries";
import { LoyaltyPointType } from "../../../../features/points_fedelite/types/loyalty.types";
import LoyaltyConfigManager from "../../../../features/points_fedelite/components/loyalty-config/LoyaltyConfigManager";

export default function PointFedelisation() {
  const {
    activeTab,
    loyalty: { view, filters, pagination },
  } = useDashboardStore();

  const {
    data: points,
    error,
    isLoading,
  } = useLoyaltyPointsListQuery({
    page: pagination.page,
    type: filters?.type as LoyaltyPointType,
    is_used: filters?.is_used as "all" | "available" | "used" | "partial",
    search: filters?.search as string,
  });

  return (
    <div className="flex-1 overflow-auto p-4 space-y-6">
      <div className="-mt-10">
        <PointFideliteHeader />
      </div>
      {/* Clients */}
      {activeTab == "loyalty" && view === "list" && (
        <div className="overflow-hidden min-h-[600px]">
          <LoyaltyFilterTab />
          <LoyaltyPointsList
            points={points}
            isLoading={isLoading}
            error={error}
          />
        </div>
      )}
      {activeTab == "loyalty" && view === "view" && <LoyaltyConfigManager />}
    </div>
  );
}
