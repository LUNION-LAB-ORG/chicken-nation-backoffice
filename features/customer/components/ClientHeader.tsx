"use client";

import React from "react";
import DashboardPageHeader from "@/components/ui/DashboardPageHeader";
import { TabKey, useDashboardStore, ViewType } from "@/store/dashboardStore";

export default function ClientHeader() {
  const {
    activeTab,
    reviews: { view: viewReviews, filters: filtersReviews },
    "card-requests": { view: viewCardRequest, filters: filtersCardRequest },
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

  if (activeTab == "clients") {
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
          actions={[
            {
              label: "Notes & avis",
              onClick: () => handleViewChange("reviews", "list"),
            },
            {
              label: "Demandes de carte",
              onClick: () => handleViewChange("card-requests", "list"),
            },
          ]}
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

  if (activeTab == "reviews") {
    if (viewReviews === "list") {
      return (
        <DashboardPageHeader
          mode="list"
          title={"Commentaires"}
          searchConfig={{
            placeholder: "Rechercher un commentaire",
            buttonText: "Chercher",
            value: filtersReviews?.search as string,
            onSearch: (search) => handleSearch("reviews", search),
            realTimeSearch: true,
          }}
          actions={[
            {
              label: "Clients",
              onClick: () => handleViewChange("clients", "list"),
            },
            {
              label: "Demandes de carte",
              onClick: () => handleViewChange("card-requests", "list"),
            },
          ]}
        />
      );
    }
    return (
      <DashboardPageHeader
        mode={viewReviews}
        onBack={() => handleViewChange("reviews", "list")}
        title={
          view === "create"
            ? "Ajouter un commentaire"
            : view === "edit"
            ? "Modifier le commentaire"
            : "Détails du commentaire"
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
          onSearch: (search) => handleSearch("card-requests", search),
          realTimeSearch: true,
        }}
        actions={[
          {
            label: "Clients",
            onClick: () => handleViewChange("clients", "list"),
          },
          {
            label: "Notes & avis",
            onClick: () => handleViewChange("reviews", "list"),
          },
        ]}
      />
    );
  }
  return (
    <DashboardPageHeader
      mode={viewCardRequest}
      onBack={() => handleViewChange("card-requests", "list")}
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
