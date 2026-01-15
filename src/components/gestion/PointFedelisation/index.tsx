"use client";

import { useAuthStore } from "../../../../features/users/hook/authStore";
import { useDashboardStore } from "@/store/dashboardStore";
import { LoyaltyPointsList } from "../../../../features/points_fedelite/components/LoyaltyPointsList";
import PointFideliteHeader from "../../../../features/points_fedelite/components/PointFideliteHeader";

export default function PointFedelisation() {
  const { user } = useAuthStore();

  const {
    activeTab,
    loyalty: { view },
  } = useDashboardStore();

  return (
    <div className="flex-1 overflow-auto p-4 space-y-6">
      <div className="-mt-10">
        <PointFideliteHeader />
      </div>

      {/* Clients */}
      {activeTab == "loyalty" && view === "list" && (
        <div className="bg-white border border-slate-100 rounded-xl sm:rounded-2xl overflow-hidden min-h-[600px]">
          <LoyaltyPointsList />
        </div>
      )}
    </div>
  );
}
