"use client";

import React from "react";
import DashboardPageHeader from "@/components/ui/DashboardPageHeader";
import { TabKey, useDashboardStore, ViewType } from "@/store/dashboardStore";

export default function PointFideliteHeader() {
  const {
    loyalty: { view, filters },
    setActiveTab,
    setFilter,
    setSectionView,
    setPagination,
  } = useDashboardStore();

  const handleSearch = (newTab: TabKey, query: string) => {
    setFilter(newTab, "search", query);
    setPagination(newTab, 1, 10);
  };

  const handleViewChange = (newTab: TabKey, newView: ViewType) => {
    setActiveTab(newTab);
    setSectionView(newTab, newView);
  };

  // Parrainage, Cadeaux et Jeux ont leurs propres entrées de menu : ce header
  // ne pilote plus que la liste des points et la configuration des niveaux.
  if (view === "list") {
    return (
      <DashboardPageHeader
        mode="list"
        title={"Points de fidélité"}
        searchConfig={{
          placeholder: "Rechercher un point de fidélité",
          buttonText: "Chercher",
          value: filters?.search as string,
          onSearch: (search) => handleSearch("loyalty", search),
          realTimeSearch: true,
        }}
        actions={[
          {
            label: "Configuration des niveaux",
            onClick: () => handleViewChange("loyalty", "view"),
          },
        ]}
      />
    );
  }
  return (
    <DashboardPageHeader
      mode={view}
      onBack={() => handleViewChange("loyalty", "list")}
      title={"Configuration des niveaux"}
      gradient={true}
    />
  );
}
