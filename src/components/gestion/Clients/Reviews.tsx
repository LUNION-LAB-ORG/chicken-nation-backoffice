"use client";

import DashboardPageHeader from "@/components/ui/DashboardPageHeader";
import { GlobalReviews } from "../../../../features/customer/components/GlobalReviews";

export default function Reviews() {
  return (
    <div className="flex-1 overflow-auto p-4 space-y-6">
      <div className="-mt-10">
        <DashboardPageHeader
          mode="list"
          title="Notes et Avis"
          subtitle="Avis et commentaires des clients"
        />
      </div>
      <div className="bg-white border border-slate-100 rounded-xl sm:rounded-2xl overflow-hidden p-4">
        <GlobalReviews />
      </div>
    </div>
  );
}
