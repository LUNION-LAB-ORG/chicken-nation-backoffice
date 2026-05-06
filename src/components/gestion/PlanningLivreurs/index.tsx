"use client";

import { SchedulePlanningView } from "../../../../features/schedule/components/SchedulePlanningView";

/**
 * Sous-page Planning livreurs — anciennement onglet virtuel dans la page Livreurs.
 * Maintenant accessible directement depuis la sidebar sous "Livreurs > Planning".
 */
export default function PlanningLivreurs() {
  return (
    <div className="flex-1 p-4">
      <SchedulePlanningView />
    </div>
  );
}
