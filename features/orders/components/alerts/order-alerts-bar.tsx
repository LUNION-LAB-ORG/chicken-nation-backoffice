"use client";

import { useState } from "react";
import { Clock, AlertCircle, CheckCircle2 } from "lucide-react";
import { useNotificationStateStore } from "../../../websocket/stores/notificationState.store";
import { OrderDetailsModal } from "./order-details-modal";

type ModalType = "late" | "pending" | "stats" | null;

export function OrderAlertsBar() {
  const [activeModal, setActiveModal] = useState<ModalType>(null);

  const activeOrders = useNotificationStateStore((s) => s.activeOrders);
  const overdueOrders = useNotificationStateStore((s) => s.overdueOrders);
  const orderTimers = useNotificationStateStore((s) => s.orderTimers);

  return (
    <>
      <div className="flex overflow-x-auto gap-2 sm:gap-3">
        {/* En attente */}
        <button
          onClick={() => setActiveModal("pending")}
          className={`flex shrink-0 items-center gap-3 px-3 py-2 rounded-lg border transition-all min-w-[110px] ${
            activeOrders.length > 0
              ? "bg-orange-50 border-orange-200 hover:bg-orange-100"
              : "bg-gray-50 border-gray-200"
          }`}
        >
          <div className="flex items-center justify-center w-8 h-8 rounded-full shrink-0 bg-orange-500 text-white">
            <Clock className="w-4 h-4" />
          </div>

          <div className="leading-tight">
            <p className="text-xs text-gray-500">En cours</p>
            <p className="text-lg font-bold text-orange-600">
              {activeOrders.length}
            </p>
          </div>
        </button>

        {/* En retard */}
        <button
          onClick={() => setActiveModal("late")}
          className={`flex shrink-0 items-center gap-3 px-3 py-2 rounded-lg border transition-all min-w-[110px]
    ${
      overdueOrders.length > 0
        ? "bg-red-50 border-red-200 hover:bg-red-100"
        : "bg-gray-50 border-gray-200"
    }
  `}
        >
          <div className="flex items-center justify-center w-8 h-8 rounded-full shrink-0 bg-red-500 text-white">
            <AlertCircle className="w-4 h-4" />
          </div>

          <div className="leading-tight">
            <p className="text-xs text-gray-500">En retard</p>
            <p className="text-lg font-bold text-red-600">
              {overdueOrders.length}
            </p>
          </div>
        </button>

        {/* Stats */}
        <button
          onClick={() => setActiveModal("stats")}
          className="flex shrink-0 items-center gap-3 px-3 py-2 rounded-lg border bg-gray-50 border-gray-200 min-w-[110px]"
        >
          <div className="flex items-center justify-center w-8 h-8 rounded-full shrink-0 bg-blue-500 text-white">
            <CheckCircle2 className="w-4 h-4" />
          </div>

          <div className="leading-tight">
            <p className="text-xs text-gray-500">Total</p>
            <p className="text-lg font-bold text-gray-900">
              {activeOrders.length}
            </p>
          </div>
        </button>
      </div>
      {/* Modals */}

      <OrderDetailsModal
        isOpen={activeModal === "pending"}
        onClose={() => setActiveModal(null)}
        title="Commandes en Cours"
        orders={activeOrders}
        type="pending"
      />

      <OrderDetailsModal
        isOpen={activeModal === "late"}
        onClose={() => setActiveModal(null)}
        title="Commandes en Retard"
        orders={overdueOrders}
        type="late"
      />

      <OrderDetailsModal
        isOpen={activeModal === "stats"}
        onClose={() => setActiveModal(null)}
        title="Statistiques"
        orders={activeOrders}
        type="stats"
        stats={{
          total: activeOrders.length,
          late: overdueOrders.length,
          pending: activeOrders.length,
          avgTime:
            orderTimers && orderTimers.length > 0
              ? orderTimers.reduce(
                  (acc, timer) => acc + timer.allowedSeconds / 60,
                  0
                ) / orderTimers.length
              : 0,
        }}
      />
    </>
  );
}
