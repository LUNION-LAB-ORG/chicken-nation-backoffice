"use client";

import DashboardPageHeader from "@/components/ui/DashboardPageHeader";
import { useRBAC } from "@/hooks/useRBAC";
import { Plus } from "lucide-react";

interface RestaurantHeaderProps {
  onAddRestaurant: () => void;
  onSearch?: (query: string) => void;
}

export default function RestaurantHeader({
  onAddRestaurant,
  onSearch,
}: RestaurantHeaderProps) {
  const { canCreateRestaurant } = useRBAC();

  // ✅ RBAC: Vérifier les permissions pour créer un restaurant
  const canAddRestaurant = canCreateRestaurant();

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
        canAddRestaurant
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
