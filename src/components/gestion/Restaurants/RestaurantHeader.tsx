"use client";

import DashboardPageHeader from "@/components/ui/DashboardPageHeader";
import { Plus } from "lucide-react";
import { useAuthStore } from "../../../../features/users/hook/authStore";
import { Action, Modules } from "../../../../features/users/types/auth.type";

interface RestaurantHeaderProps {
  onAddRestaurant: () => void;
  onSearch?: (query: string) => void;
}

export default function RestaurantHeader({
  onAddRestaurant,
  onSearch,
}: RestaurantHeaderProps) {
  const { can } = useAuthStore();
  return (
    <DashboardPageHeader
      mode="list"
      title="Restaurants"
      searchConfig={{
        placeholder: "Rechercher",
        buttonText: "Chercher",
        onSearch:
          onSearch ||
          ((value) => {
            // ✅ SÉCURITÉ: Log minimal en production
            if (process.env.NODE_ENV === "development") {
            }
          }),
        realTimeSearch: true, // ✅ Activer la recherche en temps réel
      }}
      actions={
        can(Modules.RESTAURANTS, Action.CREATE)
          ? [
              {
                label: "Ajouter un restaurant",
                onClick: onAddRestaurant,
                icon: Plus,
                variant: "primary",
              },
            ]
          : []
      }
    />
  );
}
