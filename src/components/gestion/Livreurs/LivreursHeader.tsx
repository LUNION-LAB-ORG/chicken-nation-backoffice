"use client";

import React from "react";
import DashboardPageHeader from "@/components/ui/DashboardPageHeader";

type View = "list" | "view";

interface LivreursHeaderProps {
  currentView?: View;
  onBack?: () => void;
  onSearch?: (query: string) => void;
  detailTitle?: string;
}

/**
 * Header unifié du module Livreurs — pattern inspiré de MenuHeader.
 *
 * - `currentView === 'list'` : titre + recherche temps réel (pas de bouton "Créer")
 * - `currentView === 'view'` : titre "Détails du livreur" + bouton retour intégré (gradient)
 */
function LivreursHeader({
  currentView = "list",
  onBack,
  onSearch,
  detailTitle = "Détails du livreur",
}: LivreursHeaderProps) {
  if (currentView === "list") {
    return (
      <DashboardPageHeader
        mode="list"
        title="Livreurs"
        searchConfig={{
          placeholder: "Rechercher par nom, prénom, email ou téléphone",
          buttonText: "Chercher",
          onSearch: onSearch || (() => {}),
          realTimeSearch: true,
        }}
        actions={[]}
      />
    );
  }

  return (
    <DashboardPageHeader
      mode="view"
      title={detailTitle}
      onBack={onBack}
      gradient={true}
    />
  );
}

export default LivreursHeader;
