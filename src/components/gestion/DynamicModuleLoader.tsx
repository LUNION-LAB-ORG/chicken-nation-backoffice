"use client";

import dynamic from "next/dynamic";
import { useDashboardStore } from "@/store/dashboardStore";

const LoadingSpinner = () => (
  <div className="flex items-center justify-center h-64">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#F17922]" />
  </div>
);

const modulesMap: Record<string, any> = {
  dashboard: dynamic(() => import("@/components/gestion/Dashboard"), {
    loading: () => <LoadingSpinner />,
  }),
  menus: dynamic(() => import("@/components/gestion/Menus"), {
    loading: () => <LoadingSpinner />,
  }),
  orders: dynamic(() => import("@/components/gestion/Orders"), {
    loading: () => <LoadingSpinner />,
  }),
  clients: dynamic(() => import("@/components/gestion/Clients"), {
    loading: () => <LoadingSpinner />,
  }),
  card_nation: dynamic(() => import("@/components/gestion/CarteNation"), {
    loading: () => <LoadingSpinner />,
  }),
  inventory: dynamic(() => import("@/components/gestion/Inventory"), {
    loading: () => <LoadingSpinner />,
  }),
  restaurants: dynamic(() => import("@/components/gestion/Restaurants"), {
    loading: () => <LoadingSpinner />,
  }),
  personnel: dynamic(() => import("@/components/gestion/Personnel"), {
    loading: () => <LoadingSpinner />,
  }),
  promos: dynamic(() => import("@/components/gestion/Promos"), {
    loading: () => <LoadingSpinner />,
  }),
  points: dynamic(() => import("@/components/gestion/PointFedelisation"), {
    loading: () => <LoadingSpinner />,
  }),
  marketing: dynamic(() => import("@/components/gestion/Marketing"), {
    loading: () => <LoadingSpinner />,
  }),

  inbox: dynamic(() => import("@/components/gestion/MessagesEtTickets/Inbox"), {
    loading: () => <LoadingSpinner />,
  }),
};

export default function DynamicModuleLoader() {
  const { activeTab } = useDashboardStore();

  const Component =
    modulesMap[
      activeTab === "reviews"
        ? "clients"
        : activeTab === "card_requests"
        ? "card_nation"
        : activeTab
    ] ?? modulesMap["dashboard"];
  return <Component />;
}
