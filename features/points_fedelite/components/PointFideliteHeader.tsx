"use client";

import React from "react";
import DashboardPageHeader from "@/components/ui/DashboardPageHeader";
import { TabKey, useDashboardStore, ViewType } from "@/store/dashboardStore";

export default function PointFideliteHeader() {
  const {
    activeTab,
    points: { view, filters },
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

  if (view === "list") {
    return (
      <DashboardPageHeader
        mode="list"
        title={"Points de fidélisation"}
        searchConfig={{
          placeholder: "Rechercher un point de fidélisation",
          buttonText: "Chercher",
          value: filters?.search as string,
          onSearch: (search) => handleSearch("points", search),
          realTimeSearch: true,
        }}
        actions={[
          {
            label: "Configuration",
            onClick: () => handleViewChange("points", "view"),
          },
        ]}
      />
    );
  }
  return (
    <DashboardPageHeader
      mode={view}
      onBack={() => handleViewChange("points", "list")}
      title={
        view === "create"
          ? "Créer un point de fidélisation"
          : view === "edit"
          ? "Modifier un point de fidélisation"
          : "Détails d'un point de fidélisation"
      }
      gradient={true}
    />
  );
}
