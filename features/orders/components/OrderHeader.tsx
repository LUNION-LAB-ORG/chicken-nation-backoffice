"use client";

import React from "react";
import DashboardPageHeader from "@/components/ui/DashboardPageHeader";
import ExportDropdown from "@/components/ui/ExportDropdown";
import { useRBAC } from "@/hooks/useRBAC";
import { useDashboardStore, ViewType } from "@/store/dashboardStore";
import { Order } from "../types/order.types";

interface OrderHeaderProps {
  orders: Order[];
  currentView: ViewType;
  hasPendingOrders?: boolean;
  pendingOrdersCount?: number;
}

function OrderHeader({
  orders,
  currentView = "list",
  hasPendingOrders = false,
  pendingOrdersCount = 0,
}: OrderHeaderProps) {
  const {
    orders: { filters },
    setFilter,
    setSectionView,
    setPagination,
  } = useDashboardStore();

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
      <div>
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

        {/* ✅ Indicateur visuel pour les commandes en attente */}
        {hasPendingOrders && (
          <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
            <span className="text-orange-800 font-medium">
              🔔 {pendingOrdersCount} commande
              {pendingOrdersCount > 1 ? "s" : ""} en attente
            </span>
          </div>
        )}
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
