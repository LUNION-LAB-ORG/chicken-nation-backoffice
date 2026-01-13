"use client";

import DashboardPageHeader from "@/components/ui/DashboardPageHeader";
import { useRBAC } from "@/hooks/useRBAC";
import { useDashboardStore, ViewType } from "@/store/dashboardStore";
import { OrderAlertsBar } from "./alerts/order-alerts-bar";
import ExportDropdown from "./ExportDropdown";

function OrderHeader() {
  const {
    orders: { view, filters },
    setFilter,
    setSectionView,
    setPagination,
  } = useDashboardStore();

  const { canCreateCommande } = useRBAC();

  const handleSearch = (query: string) => {
    setFilter("orders", "search", query);
    setPagination("orders", 1, 10);
  };

  const handleViewChange = (newView: ViewType) => {
    setSectionView("orders", newView);
  };

  if (view === "list") {
    return (
      <div className="mb-4">
        <DashboardPageHeader
          mode="list"
          title="Commandes"
          searchConfig={{
            placeholder: "Rechercher par référence...",
            buttonText: "Chercher",
            value: filters?.search as string,
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
              onClick: () => {},
              customComponent: <ExportDropdown buttonText="Exporter" />,
            },
          ]}
        />
        <OrderAlertsBar />
      </div>
    );
  }

  return (
    <DashboardPageHeader
      mode={view}
      onBack={() => handleViewChange("list")}
      title={
        view === "create"
          ? "Créer une commande"
          : view === "edit"
          ? "Modifier la commande"
          : "Détails "
      }
      gradient={true}
      actions={[
        {
          label: "Exporter",
          onClick: () => {}, // Sera remplacé par le dropdown
          customComponent: <ExportDropdown buttonText="Exporter" />,
        },
      ]}
    />
  );
}

export default OrderHeader;
