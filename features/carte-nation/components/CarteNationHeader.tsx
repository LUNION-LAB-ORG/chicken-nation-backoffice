"use client";

import React from "react";
import DashboardPageHeader from "@/components/ui/DashboardPageHeader";
import { TabKey, useDashboardStore, ViewType } from "@/store/dashboardStore";
import { exportCardsToExcel } from "../services/carte-nation.service";

export default function CarteNationHeader() {
  const {
    activeTab,
    card_nation: { view, filters },
    card_requests: { view: viewCardRequest, filters: filtersCardRequest },
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

  if (activeTab == "card_nation") {
    if (view === "list") {
      return (
        <DashboardPageHeader
          mode="list"
          title={"Carte de la nation"}
          searchConfig={{
            placeholder: "Rechercher une carte",
            buttonText: "Chercher",
            value: filters?.search as string,
            onSearch: (search) => handleSearch("card_nation", search),
            realTimeSearch: true,
          }}
          actions={[
            {
              label: "Demandes de carte",
              onClick: () => handleViewChange("card_requests", "list"),
            },
            {
              label: "Exporter en excel",
              onClick: () => exportCardsToExcel(),
            },
          ]}
        />
      );
    }
    return (
      <DashboardPageHeader
        mode={view}
        onBack={() => handleViewChange("card_nation", "list")}
        title={
          view === "create"
            ? "Créer une carte"
            : view === "edit"
            ? "Modifier la carte"
            : "Détails de la carte"
        }
        gradient={true}
      />
    );
  }

  if (viewCardRequest === "list") {
    return (
      <DashboardPageHeader
        mode="list"
        title={"Demandes"}
        searchConfig={{
          placeholder: "Rechercher",
          buttonText: "Chercher",
          value: filtersCardRequest?.search as string,
          onSearch: (search) => handleSearch("card_requests", search),
          realTimeSearch: true,
        }}
        actions={[
          {
            label: "Carte de la nation",
            onClick: () => handleViewChange("card_nation", "list"),
          },
        ]}
      />
    );
  }
  return (
    <DashboardPageHeader
      mode={viewCardRequest}
      onBack={() => handleViewChange("card_requests", "list")}
      title={
        view === "create"
          ? "Soumettre une demande"
          : view === "edit"
          ? "Modifier la demande"
          : "Détails de la demande"
      }
      gradient={true}
    />
  );
}
