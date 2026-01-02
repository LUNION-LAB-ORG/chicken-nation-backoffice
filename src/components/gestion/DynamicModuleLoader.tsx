"use client";

import dynamic from "next/dynamic";
import { useDashboardStore } from "@/store/dashboardStore";
import { useNavigationStore } from "@/store/navigationStore";

const LoadingSpinner = () => (
  <div className="flex items-center justify-center h-64">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#F17922]"></div>
  </div>
);

// Lazy loading
const Dashboard = dynamic(() => import("@/components/gestion/Dashboard"), {
  loading: () => <LoadingSpinner />,
});
const Menus = dynamic(() => import("@/components/gestion/Menus"), {
  loading: () => <LoadingSpinner />,
});
const Orders = dynamic(() => import("@/components/gestion/Orders"), {
  loading: () => <LoadingSpinner />,
});
const Clients = dynamic(() => import("@/components/gestion/Clients"), {
  loading: () => <LoadingSpinner />,
});
const Inventory = dynamic(() => import("@/components/gestion/Inventory"), {
  loading: () => <LoadingSpinner />,
});
const Personnel = dynamic(() => import("@/components/gestion/Personnel"), {
  loading: () => <LoadingSpinner />,
});
const Restaurants = dynamic(() => import("@/components/gestion/Restaurants"), {
  loading: () => <LoadingSpinner />,
});
const Ads = dynamic(() => import("@/components/gestion/Ads"), {
  loading: () => <LoadingSpinner />,
});
const Promos = dynamic(() => import("@/components/gestion/Promos"), {
  loading: () => <LoadingSpinner />,
});
const Loyalty = dynamic(() => import("@/components/gestion/Loyalty"), {
  loading: () => <LoadingSpinner />,
});
const Apps = dynamic(() => import("@/components/gestion/Apps"), {
  loading: () => <LoadingSpinner />,
});
const RapportModule = dynamic(
  () => import("@/components/gestion/MessagesEtTickets/Rapport"),
  { loading: () => <LoadingSpinner /> }
);
const InboxModule = dynamic(
  () => import("@/components/gestion/MessagesEtTickets/Inbox"),
  { loading: () => <LoadingSpinner /> }
);
const TicketsModule = dynamic(
  () => import("@/components/gestion/MessagesEtTickets/Tickets"),
  { loading: () => <LoadingSpinner /> }
);
const MarketingModule = dynamic(
  () => import("@/components/gestion/Marketing"),
  { loading: () => <LoadingSpinner /> }
);

export default function DynamicModuleLoader() {
  const { activeTab } = useDashboardStore();
  const { activeSubModule, initialConversationId } = useNavigationStore();

  // Gestion des Messages et Tickets
  if (activeTab === "messages-tickets") {
    switch (activeSubModule) {
      case "rapport":
        return <RapportModule />;
      case "inbox":
        return <InboxModule initialConversationId={initialConversationId} />;
      case "tickets":
        return <TicketsModule />;
      default:
        return <InboxModule initialConversationId={initialConversationId} />;
    }
  }

  // Autres modules
  switch (activeTab) {
    case "dashboard":
      return <Dashboard />;
    case "menus":
      return <Menus />;
    case "orders":
      return <Orders />;
    case "clients":
      return <Clients/>;
    case "inventory":
      return <Inventory />;
    case "restaurants":
      return <Restaurants />;
    case "personnel":
      return <Personnel />;
    case "marketing":
      return <MarketingModule />;
    case "ads":
      return <Ads />;
    case "promos":
      return <Promos />;
    case "loyalty":
      return <Loyalty />;
    case "apps":
      return <Apps />;
    default:
      return <Dashboard />;
  }
}
