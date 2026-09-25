"use client";

import React from "react";
import DashboardPageHeader from "@/components/ui/DashboardPageHeader";
import { Plus } from "lucide-react";
import { useAuthStore } from "../../../../features/users/hook/authStore";
import { Action, Modules } from "../../../../features/users/types/auth.type";

interface MenuHeaderProps {
  currentView: "list" | "create" | "edit" | "view";
  onBack?: () => void;
  onCreateMenu?: () => void;
  onSearch?: (searchQuery: string) => void;
}

function MenuHeader({
  currentView = "list",
  onBack,
  onCreateMenu,
  onSearch,
}: MenuHeaderProps) {
  // Sélecteur booléen : le bouton apparaît ou disparaît dès que les droits
  // sont relus, sans attendre un autre rendu.
  const peutCreer = useAuthStore((s) => s.can(Modules.MENUS, Action.CREATE));
  if (currentView === "list") {
    return (
      <DashboardPageHeader
        mode="list"
        title="Plat"
        searchConfig={{
          placeholder: "Rechercher un plat",
          buttonText: "Chercher",
          onSearch: onSearch || ((value) => console.log("Searching:", value)),
          realTimeSearch: true, // ✅ Activer la recherche en temps réel
        }}
        actions={
          peutCreer && onCreateMenu
            ? [
                {
                  label: "Créer un plat",
                  onClick: onCreateMenu,
                  icon: Plus,
                },
              ]
            : []
        }
      />
    );
  }

  return (
    <DashboardPageHeader
      mode={currentView}
      onBack={onBack}
      title={
        currentView === "create"
          ? "Créer un plat"
          : currentView === "edit"
          ? "Modifier le plat"
          : "Détails du plat"
      }
      gradient={true}
    />
  );
}

export default MenuHeader;
