"use client";

import React, { useMemo, useState } from "react";

import { useDashboardStore } from "@/store/dashboardStore";

import { OperationsDrawer } from "../../../../features/operations/components/OperationsDrawer";
import { OperationsHeader } from "../../../../features/operations/components/OperationsHeader";
import { OperationsKpiBar } from "../../../../features/operations/components/OperationsKpiBar";
import { OperationsSections } from "../../../../features/operations/components/OperationsSections";
import type { DrawerTabKey } from "../../../../features/operations/components/drawer/DrawerTabs";
import { useOperationsSocketSync } from "../../../../features/operations/hooks/useOperationsSocketSync";
import { useOperationsActiveQuery } from "../../../../features/operations/queries/operations-active.query";
import { groupOrdersForOperations } from "../../../../features/operations/utils/group-orders";
import { OrderType, type Order } from "../../../../features/orders/types/order.types";

/**
 * Page "Opérations" — temps réel, cards + drawer.
 *
 * Flux :
 *  1. Header : titre + champ "Code retrait" livreur → modal de validation
 *  2. Barre KPI 4 compteurs (À préparer / Prêtes / Problèmes / En livraison)
 *  3. Grille cards répartie en 4 sections : À préparer / Prêtes / Collectées / Problèmes
 *  4. Clic sur card → drawer à droite avec actions contextuelles (CN ou Turbo)
 *  5. WebSocket : order:* + course:* event → invalidation + refetch instantané
 */
export default function Operations() {
  useOperationsSocketSync();

  const { selectedRestaurantId } = useDashboardStore();
  const { data, isLoading } = useOperationsActiveQuery(selectedRestaurantId ?? undefined);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [initialTab, setInitialTab] = useState<DrawerTabKey>("details");

  const buckets = useMemo(() => groupOrdersForOperations(data ?? []), [data]);

  // KPI "En livraison" = sous-ensemble des récupérées dont type=DELIVERY (en route vers client)
  const inDeliveryCount = useMemo(
    () => buckets.recuperees.filter((o) => o.type === OrderType.DELIVERY).length,
    [buckets.recuperees],
  );

  const handleCardClick = (order: Order) => {
    setInitialTab("details");
    setSelectedOrder(order);
  };

  const handlePayClick = (order: Order) => {
    setInitialTab("payment");
    setSelectedOrder(order);
  };

  return (
    <div className="flex-1 p-4 space-y-4">
      <OperationsHeader />

      <OperationsKpiBar buckets={buckets} inDeliveryCount={inDeliveryCount} />

      {isLoading && !data ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#F17922]" />
        </div>
      ) : (
        <OperationsSections
          buckets={buckets}
          onCardClick={handleCardClick}
          onPayClick={handlePayClick}
        />
      )}

      <OperationsDrawer
        order={selectedOrder}
        initialTab={initialTab}
        onClose={() => setSelectedOrder(null)}
      />
    </div>
  );
}
