"use client";

import DashboardPageHeader from "@/components/ui/DashboardPageHeader";
import { useDashboardStore } from "@/store/dashboardStore";

import { DelivererLiveMap } from "../../../../features/livreurs/components/DelivererLiveMap";

/**
 * En direct (conception du 24/10, section 9) : où sont les livreurs, et ce
 * qui ne va pas. Admin et suivi des livraisons (droit LIVREURS READ).
 *
 * Écran PROVISOIRE : la carte qui était l'onglet « Carte live » de Livreurs
 * et le bouton « Carte live des livreurs » de Courses, telle quelle. Elle
 * part sur le restaurant choisi dans Commandes et garde son propre
 * sélecteur. L'écran définitif (« À surveiller », livreurs groupés par état,
 * bandeau des restaurants) la remplacera.
 */
export default function EnDirect() {
  const selectedRestaurantId = useDashboardStore((s) => s.selectedRestaurantId);

  return (
    <div className="flex-1 p-4">
      <DashboardPageHeader mode="list" title="En direct" />
      <DelivererLiveMap restaurantId={selectedRestaurantId ?? undefined} />
    </div>
  );
}
