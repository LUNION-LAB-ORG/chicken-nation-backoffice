"use client";

import React from "react";
import { Check, X } from "lucide-react";

import type { Course, Delivery } from "../../courses/types/course.types";
import type { OrderStatus } from "../../orders/types/order.types";
import { useValidatePickupMutation } from "../queries/validate-pickup.mutation";
import { ServiceBadge } from "./ServiceBadge";

/**
 * Libellés alignés sur le mapper `orderMapper.ts` de la page Commandes —
 * aucune divergence tolérée : on affiche partout exactement ce que la page
 * Commandes affiche pour un statut donné.
 */
const STATUS_LABEL: Record<OrderStatus, string> = {
  PENDING: "EN ATTENTE",
  ACCEPTED: "NOUVELLE",
  IN_PROGRESS: "EN PRÉPARATION",
  READY: "PRÊT",
  PICKED_UP: "COLLECTÉE",
  COLLECTED: "LIVRÉE",
  COMPLETED: "TERMINÉE",
  CANCELLED: "ANNULÉE",
};

interface Props {
  course: Course;
  onClose: () => void;
}

/**
 * Modal affichée quand la caissière a saisi un pickup_code valide.
 * Liste toutes les commandes de la course + leur statut.
 * "Valider la récupération" est désactivé tant que toutes ne sont pas READY.
 */
export const PickupValidationModal: React.FC<Props> = ({ course, onClose }) => {
  const { mutate: validate, isPending } = useValidatePickupMutation();

  const notReady = course.deliveries.filter((d) => d.order.status !== "READY");
  const canValidate = notReady.length === 0;

  const handleValidate = () => {
    validate(course.pickup_code, {
      onSuccess: () => onClose(),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <h3 className="text-base font-bold text-gray-900">
              Récupération — code <span className="font-mono text-[#F17922]">{course.pickup_code}</span>
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Course {course.reference} · {course.deliveries.length} commande(s)
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {course.deliveries.map((d) => (
            <DeliveryStatusRow key={d.id} delivery={d} />
          ))}
        </div>

        <div className="px-5 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between gap-3">
          <div className="text-xs text-gray-600">
            {canValidate ? (
              <span className="text-green-700 font-medium">✓ Toutes les commandes sont prêtes</span>
            ) : (
              <span className="text-amber-700 font-medium">
                ⚠ {notReady.length} commande(s) pas encore prête(s)
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-white"
            >
              Annuler
            </button>
            <button
              onClick={handleValidate}
              disabled={!canValidate || isPending}
              className="px-4 py-2 text-sm bg-[#F17922] text-white font-semibold rounded-lg disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              {isPending ? "Validation…" : "Valider la récupération"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

function DeliveryStatusRow({ delivery }: { delivery: Delivery }) {
  const ready = delivery.order.status === "READY";
  return (
    <div
      className={`flex items-center justify-between gap-3 p-3 rounded-lg border ${
        ready ? "border-green-200 bg-green-50" : "border-amber-200 bg-amber-50"
      }`}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-gray-900">{delivery.order.reference}</span>
          <ServiceBadge service="CHICKEN_NATION" size="sm" />
        </div>
        <div className="text-xs text-gray-600 mt-0.5">
          {delivery.order.fullname ?? "Client"} ·{" "}
          {delivery.order.amount.toLocaleString("fr-FR")} F
        </div>
      </div>
      <span
        className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
          ready ? "text-green-800 bg-white border border-green-300" : "text-amber-800 bg-white border border-amber-300"
        }`}
      >
        {ready ? "PRÊT" : STATUS_LABEL[delivery.order.status as OrderStatus] ?? "—"}
      </span>
    </div>
  );
}
