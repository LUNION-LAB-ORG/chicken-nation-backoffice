"use client";

import { useDashboardStore } from "@/store/dashboardStore";
import { useNavigationStore } from "@/store/navigationStore";
import { useInboxNavigation } from "@/hooks/useInboxNavigation";
import DynamicModuleLoader from "@/components/gestion/DynamicModuleLoader";
import { useEffect } from "react";

export default function GestionPage() {
  const { activeTab, setActiveTab } = useDashboardStore();
  const { activeSubModule, setActiveSubModule } = useNavigationStore();

  useInboxNavigation();

  // Sous-module par défaut pour Messages et Tickets
  useEffect(() => {
    if (activeTab === "messages-tickets" && !activeSubModule) {
      setActiveSubModule("inbox");
    }
  }, [activeTab, activeSubModule, setActiveSubModule]);

  const isMessagesTickets = activeTab === "messages-tickets";

  return (
    <main
      className={`flex-1 pt-14 ${
        isMessagesTickets ? "overflow-hidden" : "overflow-y-auto"
      }`}
    >
      {isMessagesTickets ? (
        <div className="h-full">
          <DynamicModuleLoader />
        </div>
      ) : (
        <div className="container mx-auto">
          <DynamicModuleLoader />
        </div>
      )}
    </main>
  );
}
