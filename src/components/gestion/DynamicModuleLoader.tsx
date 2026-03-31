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
  reviews: dynamic(() => import("@/components/gestion/Clients/Reviews"), {
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
  loyalty: dynamic(() => import("@/components/gestion/PointFedelisation"), {
    loading: () => <LoadingSpinner />,
  }),
  voucher: dynamic(() => import("@/components/gestion/BonDeReduction"), {
    loading: () => <LoadingSpinner />,
  }),
  marketing: dynamic(() => import("@/components/gestion/Marketing"), {
    loading: () => <LoadingSpinner />,
  }),
  promo_code: dynamic(() => import("@/components/gestion/CodesPromo"), {
    loading: () => <LoadingSpinner />,
  }),

  inbox: dynamic(() => import("@/components/gestion/MessagesEtTickets/Inbox"), {
    loading: () => <LoadingSpinner />,
  }),
  tickets: dynamic(() => import("@/components/gestion/MessagesEtTickets/Tickets"), {
    loading: () => <LoadingSpinner />,
  }),

  // ---- Statistiques détaillées ----
  stats_products: dynamic(
    () => import("@/components/gestion/Statistiques/StatsProducts"),
    { loading: () => <LoadingSpinner /> }
  ),
  stats_orders: dynamic(
    () => import("@/components/gestion/Statistiques/StatsOrders"),
    { loading: () => <LoadingSpinner /> }
  ),
  stats_clients: dynamic(
    () => import("@/components/gestion/Statistiques/StatsClients"),
    { loading: () => <LoadingSpinner /> }
  ),
  stats_delivery: dynamic(
    () => import("@/components/gestion/Statistiques/StatsDelivery"),
    { loading: () => <LoadingSpinner /> }
  ),
  stats_marketing: dynamic(
    () => import("@/components/gestion/Statistiques/StatsMarketing"),
    { loading: () => <LoadingSpinner /> }
  ),
  stats_retention_callbacks: dynamic(
    () => import("@/components/gestion/Statistiques/StatsRetentionCallbacks"),
    { loading: () => <LoadingSpinner /> }
  ),

  // ---- Notifications ----
  notifications: dynamic(() => import("@/components/gestion/Notifications"), {
    loading: () => <LoadingSpinner />,
  }),

  // ---- Intégrations ----
  hubrise: dynamic(() => import("@/components/gestion/HubRise"), {
    loading: () => <LoadingSpinner />,
  }),

  // ---- Paramètres ----
  settings: dynamic(() => import("@/components/gestion/Settings"), {
    loading: () => <LoadingSpinner />,
  }),
};

export default function DynamicModuleLoader() {
  const { activeTab } = useDashboardStore();

  const Component =
    modulesMap[
      activeTab === "card_requests"
        ? "card_nation"
        : activeTab
    ] ?? modulesMap["dashboard"];
  return <Component />;
}
