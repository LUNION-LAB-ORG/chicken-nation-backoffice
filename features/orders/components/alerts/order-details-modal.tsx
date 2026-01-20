"use client";

import { AlertTriangle, Clock, TrendingUp, X, ChefHat, Truck } from "lucide-react";
import { useNotificationStateStore } from "../../../websocket/stores/notificationState.store";
import { useOrderActions } from "../../hooks/useOrderActions";
import { ORDER_SLA } from "../../sla/orderSla.config";
import { OrderTable } from "../../types/ordersTable.types";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface OrderDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  orders: OrderTable[];
  type: "late" | "pending" | "stats";
  stats?: {
    total: number;
    late: number;
    pending: number;
    avgTime: number;
  };
}

export function OrderDetailsModal({
  isOpen,
  onClose,
  title,
  orders,
  type,
  stats,
}: OrderDetailsModalProps) {
  const { orderTimers } = useNotificationStateStore();
  const { handleViewOrderDetails } = useOrderActions();

  // ======================
  // LOGIQUE
  // ======================

  const getTimer = (orderId: string) =>
    orderTimers.find((t) => t.orderId === orderId);

  const getRemainingSeconds = (orderId: string) => {
    const timer = getTimer(orderId);
    if (!timer) return 0;
    return timer.allowedSeconds - timer.elapsedSeconds;
  };

  const getProgressPercentage = (orderId: string) => {
    const timer = getTimer(orderId);
    if (!timer || timer.allowedSeconds === 0) return 0;

    const progress = (timer.elapsedSeconds / timer.allowedSeconds) * 100;

    return Math.min(Math.max(progress, 0), 100);
  };

  const formatTime = (seconds: number) => {
    const absSeconds = Math.abs(seconds);
    const hours = Math.floor(absSeconds / 3600);
    const minutes = Math.floor((absSeconds % 3600) / 60);
    const secs = absSeconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    }
    return `${minutes}m ${secs}s`;
  };

  const formatDate = (dateStr: string) => {
    return format(new Date(dateStr), "dd/MM à HH:mm", { locale: fr });
  };

  /**
   * Détermine qui est responsable du retard
   * - Restaurant : NOUVELLE → PRÊT
   * - Livraison : PRÊT → LIVRÉE
   */
  const getResponsibility = (order: OrderTable) => {
    const restaurantSteps = ["NOUVELLE", "EN COURS", "EN PRÉPARATION"];
    const deliverySteps = ["PRÊT", "COLLECTÉE"];

    if (restaurantSteps.includes(order.status)) {
      return {
        type: "restaurant" as const,
        icon: ChefHat,
        label: "Restaurant",
        color: "amber",
      };
    }

    if (deliverySteps.includes(order.status)) {
      return {
        type: "delivery" as const,
        icon: Truck,
        label: "Livraison",
        color: "purple",
      };
    }

    return null;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[85vh] overflow-hidden border border-gray-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-xl font-bold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(85vh-80px)]">
          {type === "stats" && stats ? (
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-blue-600 font-medium">
                        Total Commandes
                      </p>
                      <p className="text-2xl font-bold text-blue-900">
                        {stats.total}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center">
                      <AlertTriangle className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-red-600 font-medium">
                        En Retard
                      </p>
                      <p className="text-2xl font-bold text-red-900">
                        {stats.late}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center">
                      <Clock className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-orange-600 font-medium">
                        En Attente
                      </p>
                      <p className="text-2xl font-bold text-orange-900">
                        {stats.pending}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center">
                      <Clock className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-green-600 font-medium">
                        Temps Moyen
                      </p>
                      <p className="text-2xl font-bold text-green-900">
                        {stats.avgTime.toFixed(1)}min
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-3">
                  Performance du Jour
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Taux de Retard</span>
                    <span className="font-semibold text-gray-900">
                      {stats.total > 0
                        ? ((stats.late / stats.total) * 100).toFixed(1)
                        : 0}
                      %
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-red-500 h-2 rounded-full transition-all"
                      style={{
                        width: `${
                          stats.total > 0 ? (stats.late / stats.total) * 100 : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-6 space-y-3">
              {orders.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                    <Clock className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-500 font-medium">Aucune commande</p>
                  <p className="text-sm text-gray-400 mt-1">
                    Tout est sous contrôle !
                  </p>
                </div>
              ) : (
                orders.map((order) => {
                  const timer = getTimer(order.id);
                  const remainingSeconds = getRemainingSeconds(order.id);
                  const isLate = timer?.isOverdue ?? false;
                  const progress = getProgressPercentage(order.id);
                  const responsibility = getResponsibility(order);

                  return (
                    <div
                      key={order.id}
                      onClick={() => handleViewOrderDetails(order)}
                      className={`rounded-lg border p-4 transition-all cursor-pointer shadow ${
                        isLate
                          ? "bg-red-50 border-red-300 hover:border-red-400"
                          : "bg-white border-gray-200 hover:border-[#F17922]"
                      }`}
                    >
                      {/* En-tête */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="font-mono text-sm font-semibold text-gray-900">
                              {order.reference}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                isLate
                                  ? "bg-red-100 text-red-700"
                                  : "bg-orange-100 text-orange-700"
                              }`}
                            >
                              {order.status}
                            </span>
                            
                            {/* Badge de responsabilité */}
                            {responsibility && isLate && (
                              <span
                                className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium
                                  ${responsibility.color === "amber" 
                                    ? "bg-amber-100 text-amber-700" 
                                    : "bg-purple-100 text-purple-700"}`}
                              >
                                <responsibility.icon className="w-3 h-3" />
                                {responsibility.label}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 font-medium">
                            {order.clientName}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {order.restaurantName}
                          </p>
                        </div>

                        {/* Timer */}
                        <div
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${
                            isLate
                              ? "bg-red-100 text-red-700 animate-pulse"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          <Clock className="w-4 h-4" />
                          <span className="font-mono text-sm font-bold">
                            {timer
                              ? isLate
                                ? `+${formatTime(Math.abs(remainingSeconds))}`
                                : formatTime(remainingSeconds)
                              : "N/A"}
                          </span>
                        </div>
                      </div>

                      {/* Raison du retard / état */}
                      <div className={`text-sm mb-3 p-2 rounded ${
                        isLate ? "bg-red-100/50" : "bg-gray-50"
                      }`}>
                        <p className={`font-medium ${isLate ? "text-red-800" : "text-gray-700"}`}>
                          {isLate
                            ? ORDER_SLA[order.status]?.lateReason
                            : ORDER_SLA[order.status]?.reason}
                        </p>
                      </div>

                      {/* Timeline des dates */}
                      <div className="space-y-2 text-xs border-t border-gray-400 pt-3">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <span className="text-gray-500">Créée :</span>
                            <span className="ml-1 font-medium text-gray-700">
                              {formatDate(order.createdAt)}
                            </span>
                          </div>
                          {order.readyAt && (
                            <div>
                              <span className="text-gray-500">Prête :</span>
                              <span className="ml-1 font-medium text-green-600">
                                {formatDate(order.readyAt)}
                              </span>
                            </div>
                          )}
                          {order.pickedUpAt && (
                            <div>
                              <span className="text-gray-500">Récupérée :</span>
                              <span className="ml-1 font-medium text-blue-600">
                                {formatDate(order.pickedUpAt)}
                              </span>
                            </div>
                          )}
                          {order.collectedAt && (
                            <div>
                              <span className="text-gray-500">Livrée :</span>
                              <span className="ml-1 font-medium text-purple-600">
                                {formatDate(order.collectedAt)}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Progress Bar */}
                      {!isLate && timer && (
                        <div className="space-y-1 mt-3">
                          <div className="flex justify-between text-xs text-gray-500">
                            <span>Progression</span>
                            <span>{Math.round(progress)}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-1.5">
                            <div
                              className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}