"use client";

import React from "react";
import DashboardPageHeader from "@/components/ui/DashboardPageHeader";
import { TabKey, useDashboardStore, ViewType } from "@/store/dashboardStore";

export default function ClientHeader() {
  const {
    clients: { view, filters },
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
        title={"Clients"}
        searchConfig={{
          placeholder: "Rechercher un client",
          buttonText: "Chercher",
          value: filters?.search as string,
          onSearch: (search) => handleSearch("clients", search),
          realTimeSearch: true,
        }}
      />
    );
  }
  return (
    <DashboardPageHeader
      mode={view}
      onBack={() => handleViewChange("clients", "list")}
      title={
        view === "create"
          ? "Créer un client"
          : view === "edit"
          ? "Modifier le client"
          : "Détails du client"
      }
      gradient={true}
    />
  );
}
