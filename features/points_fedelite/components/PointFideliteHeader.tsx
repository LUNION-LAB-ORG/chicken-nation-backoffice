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

  if (view === "list") {
    return (
      <DashboardPageHeader
        mode="list"
        title={"Points de fidélisation"}
        searchConfig={{
          placeholder: "Rechercher un point de fidélisation",
          buttonText: "Chercher",
          value: filters?.search as string,
          onSearch: (search) => handleSearch("loyalty", search),
          realTimeSearch: true,
        }}
        actions={[
          {
            label: "Envoyer un cadeau",
            onClick: () => handleViewChange("loyalty", "create"),
          },
          {
            label: "Configuration",
            onClick: () => handleViewChange("loyalty", "view"),
          },
          {
            label: "Parrainage",
            onClick: () => handleViewChange("loyalty", "edit"),
          },
          {
            label: "Gratte & Gagne",
            onClick: () => handleViewChange("loyalty", "scratch"),
          },
        ]}
      />
    );
  }
  return (
    <DashboardPageHeader
      mode={view}
      onBack={() => handleViewChange("loyalty", "list")}
      title={
        view === "create"
          ? "Envoyer un cadeau"
          : view === "edit"
          ? "Parrainage"
          : view === "scratch"
          ? "Gratte & Gagne"
          : "Configuration"
      }
      gradient={true}
    />
  );
}
