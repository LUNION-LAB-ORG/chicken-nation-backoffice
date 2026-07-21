"use client";

import DashboardPageHeader from "@/components/ui/DashboardPageHeader";
import { useAuthStore } from "../../users/hook/authStore";
import CallTargetPicker from "./CallTargetPicker";
import CallHistoryList from "./CallHistoryList";
import NotificationBanner from "./NotificationBanner";

/** Page « Appel » (sous Messages et tickets). */
export default function AppelView() {
  const user = useAuthStore((s) => s.user);

  return (
    <div className="flex-1 space-y-4 overflow-auto p-4 sm:space-y-6">
      <div className="-mt-10">
        <DashboardPageHeader
          mode="list"
          title="Appels"
          subtitle="Appelez le call center ou un restaurant"
        />
      </div>

      <NotificationBanner />

      <div className="grid grid-cols-1 gap-4 sm:gap-6 xl:grid-cols-5">
        <div className="xl:col-span-3">
          <CallTargetPicker userType={user?.type} />
        </div>
        <div className="xl:col-span-2">
          <CallHistoryList />
        </div>
      </div>
    </div>
  );
}
