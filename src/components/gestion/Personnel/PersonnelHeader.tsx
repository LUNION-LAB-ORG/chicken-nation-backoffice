"use client";

import React from "react";
import DashboardPageHeader from "@/components/ui/DashboardPageHeader";
import { useAuthStore } from "../../../../features/users/hook/authStore";
import { Action, Modules } from "../../../../features/users/types/auth.type";

interface MenuHeaderProps {
  onAddPersonnel?: () => void;
  onSearch?: (query: string) => void;
  isReadOnly?: boolean;
}

function PersonnelHeader({
  onAddPersonnel,
  onSearch,
  isReadOnly = false,
}: MenuHeaderProps) {
  const { can } = useAuthStore();
  const canAddPersonnel =
    !isReadOnly && can(Modules.PERSONNELS, Action.CREATE) && onAddPersonnel;

  return (
    <DashboardPageHeader
      mode="list"
      title="Personnel"
      searchConfig={{
        placeholder: "Rechercher",
        buttonText: "Chercher",
        onSearch: onSearch || ((value) => console.log("Searching:", value)),
        realTimeSearch: true, // ✅ Activer la recherche en temps réel
      }}
      actions={
        canAddPersonnel
          ? [
              {
                label: "Créer un membre",
                onClick: onAddPersonnel,
              },
            ]
          : []
      }
    />
  );
}

export default PersonnelHeader;
