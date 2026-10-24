"use client";

import { useQueryClient } from "@tanstack/react-query";

import DashboardPageHeader from "@/components/ui/DashboardPageHeader";
import { useDashboardStore } from "@/store/dashboardStore";

import RestaurantTabs from "../../../../features/orders/components/filtrage/RestaurantTabs";
import { estCompteDeRestaurant } from "../../../../features/operations/utils/code-retrait";
import { ApercuPlannings } from "../../../../features/schedule/components/ApercuPlannings";
import { SchedulePlanningView } from "../../../../features/schedule/components/SchedulePlanningView";
import { useAuthStore } from "../../../../features/users/hook/authStore";

/**
 * Planning (menu Livraison, conception du 24/10, 10.3).
 *
 * Admin : tous les restaurants ; manager et assistant : le leur ; suivi des
 * livraisons : lecture. Siège sur « Tous les restaurants » : le tableau
 * « Plannings des restaurants » ; un restaurant choisi, ou un compte de
 * restaurant : la liste de ses plannings et le détail.
 *
 * Le restaurant choisi est celui de Commandes (`dashboardStore`,
 * persisté). Un compte de restaurant voit toujours le sien, quoi qu'il reste
 * choisi dans le navigateur.
 */
export default function PlanningLivreurs() {
  const qc = useQueryClient();
  const membre = useAuthStore((s) => s.user);
  const selectedRestaurantId = useDashboardStore((s) => s.selectedRestaurantId);
  const setSelectedRestaurantId = useDashboardStore((s) => s.setSelectedRestaurantId);

  const compteDeRestaurant = estCompteDeRestaurant(membre);
  const restaurantId = compteDeRestaurant ? membre?.restaurant_id || null : selectedRestaurantId;

  return (
    <div className="flex-1 p-4 space-y-4">
      <DashboardPageHeader
        mode="list"
        title="Planning"
        actions={[
          {
            label: "Actualiser",
            onClick: () => qc.invalidateQueries({ queryKey: ["schedule"] }),
            variant: "secondary" as const,
            className: "bg-white border border-gray-300 text-[#595959] hover:bg-gray-50",
          },
        ]}
      />

      {/* Emplacement du bandeau des restaurants (section 8, branche
          bo-livraison), branché à la fusion. En attendant, et sur un serveur
          sans `GET /livraison/tableau`, les onglets des restaurants gardent le
          filtre (section 12). Un compte de restaurant n'a pas d'onglets. */}
      {!compteDeRestaurant && <RestaurantTabs showAllTab />}

      {restaurantId ? (
        <SchedulePlanningView
          key={restaurantId}
          restaurantId={restaurantId}
          choixRestaurant={!compteDeRestaurant}
        />
      ) : compteDeRestaurant ? (
        <p className="text-sm text-gray-500 py-6 text-center">
          Aucun restaurant n&apos;est rattaché à votre compte.
        </p>
      ) : (
        <ApercuPlannings onChoisir={(id) => setSelectedRestaurantId(id)} />
      )}
    </div>
  );
}
