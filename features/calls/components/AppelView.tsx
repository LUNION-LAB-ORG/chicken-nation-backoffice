"use client";

import DashboardPageHeader from "@/components/ui/DashboardPageHeader";
import { useAuthStore } from "../../users/hook/authStore";
import CallTargetPicker from "./CallTargetPicker";
import CallHistoryList from "./CallHistoryList";

/** Page « Appel » (sous Messages et tickets). */
export default function AppelView() {
  const user = useAuthStore((s) => s.user);

  return (
    <div className="flex-1 overflow-auto p-4 space-y-6">
      <div className="-mt-10">
        <DashboardPageHeader
          mode="list"
          title="Appels"
          subtitle="Appelez le call center ou un restaurant"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CallTargetPicker userType={user?.type} />
        <CallHistoryList />
      </div>
    </div>
  );
}
