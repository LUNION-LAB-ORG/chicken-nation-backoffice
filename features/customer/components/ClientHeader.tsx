"use client";

import React from "react";
import DashboardPageHeader from "@/components/ui/DashboardPageHeader";
import { useDashboardStore, ViewType } from "@/store/dashboardStore";

export default function ClientHeader() {
  const {
    clients: { view, selectedItem, filters },
    setFilter,
    setSectionView,
    setPagination,
  } = useDashboardStore();

  const handleSearch = (query: string) => {
    setFilter("clients", "search", query);
    setPagination("clients", 1, 10);
  };

  const handleViewChange = (newView: ViewType) => {
    if (newView == "reviews" && view === "list" && selectedItem) {
      setSectionView("clients", "view");
    }
    setSectionView("clients", newView);
  };

  // Vue liste principale
  if (view === "list") {
    return (
      <DashboardPageHeader
        mode="list"
        title="Clients"
        searchConfig={{
          placeholder: "Rechercher un client",
          buttonText: "Chercher",
          value: filters?.search,
          onSearch: handleSearch,
          realTimeSearch: true,
        }}
        actions={[
          {
            label: "Notes & avis",
            onClick: () => handleViewChange("reviews"),
          },
          {
            label: "Demandes de carte",
            onClick: () => handleViewChange("card"),
          },
        ]}
      />
    );
  }

  return (
    <DashboardPageHeader
      mode={view === "reviews" || view === "card" ? "view" : view}
      onBack={() => handleViewChange("list")}
      title={
        view === "create"
          ? "Créer un client"
          : view === "edit"
          ? "Modifier le client"
          : view === "reviews"
          ? "Commentaires"
          : view === "card"
          ? "Demandes de Carte Nation"
          : "Détails du client"
      }
      gradient={true}
    />
  );
}
