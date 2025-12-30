"use client";

import DashboardPageHeader from "@/components/ui/DashboardPageHeader";
import ExportDropdown from "@/components/ui/ExportDropdown";
import { useRBAC } from "@/hooks/useRBAC";
import { useDashboardStore, ViewType } from "@/store/dashboardStore";
import { Order } from "../types/order.types";
import { useNotificationStateStore } from "../../websocket/stores/notificationState.store";
import { OrderAlertsBar } from "./alerts/order-alerts-bar";

interface OrderHeaderProps {
  orders: Order[];
  currentView: ViewType;
}

function OrderHeader({ orders, currentView = "list" }: OrderHeaderProps) {
  const {
    orders: { filters },
    setFilter,
    setSectionView,
    setPagination,
  } = useDashboardStore();

  const activeOrders = useNotificationStateStore((s) => s.activeOrders);
  const { canCreateCommande } = useRBAC();

  const handleSearch = (query: string) => {
    setFilter("orders", "search", query);
    setPagination("orders", 1, 10);
  };

  const handleViewChange = (newView: "list" | "create" | "edit" | "view") => {
    setSectionView("orders", newView);
  };
  if (currentView === "list") {
    return (
      <div className="mb-4">
        <DashboardPageHeader
          mode="list"
          title="Commandes"
          searchConfig={{
            placeholder: "Rechercher par référence...",
            buttonText: "Chercher",
            value: filters?.search,
            onSearch: handleSearch,
            realTimeSearch: true,
          }}
          actions={[
            // ✅ RBAC: Bouton de création de catégorie seulement si permission
            ...(canCreateCommande()
              ? [
                  {
                    label: "Créer une commande",
                    onClick: () => handleViewChange("create"),
                    variant: "secondary" as const,
                    className:
                      "bg-white border border-[#F17922] text-[#F17922] hover:bg-white hover:opacity-80",
                  },
                ]
              : []),
            {
              label: "Exporter",
              onClick: () => {}, // Sera remplacé par le dropdown
              customComponent: (
                <ExportDropdown orders={orders} buttonText="Exporter" />
              ),
            },
          ]}
        />
        <OrderAlertsBar />
      </div>
    );
  }

  return (
    <DashboardPageHeader
      mode={currentView === "view" ? "detail" : currentView}
      onBack={() => handleViewChange("list")}
      title={
        currentView === "create"
          ? "Créer une commande"
          : currentView === "edit"
          ? "Modifier la commande"
          : "Détails "
      }
      gradient={true}
      actions={[
        {
          label: "Exporter",
          onClick: () => {}, // Sera remplacé par le dropdown
          customComponent: (
            <ExportDropdown orders={orders} buttonText="Exporter" />
          ),
        },
      ]}
    />
  );
}

export default OrderHeader;
