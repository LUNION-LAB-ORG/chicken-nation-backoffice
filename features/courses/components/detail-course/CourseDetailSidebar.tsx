"use client";

import React from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { AlertTriangle, Ban, Phone, RotateCw, Truck, UserPlus } from "lucide-react";
import { useDashboardStore } from "@/store/dashboardStore";

import { useCourseRetryMutation } from "../../queries/course-retry.mutation";
import type { CourseWithAttempts } from "../../types/course.types";
import { formatDelivererName } from "../../utils/course-labels";

interface Props {
  course: CourseWithAttempts;
}

function formatPrix(n: number): string {
  return n.toLocaleString("fr-FR").replace(/\s/g, ".") + " F";
}

/** Colonne droite du détail course : livreur + actions + breakdown financier. */
export function CourseDetailSidebar({ course }: Props) {
  const { toggleModal } = useDashboardStore();
  const { mutate: retryCourse, isPending: isRetrying } = useCourseRetryMutation();

  const terminal = ["COMPLETED", "CANCELLED", "EXPIRED"].includes(course.statut);
  const delivererName = formatDelivererName(course.deliverer);

  return (
    <div className="space-y-4">
      {/* Livreur card */}
      <div className="bg-white border border-gray-100 rounded-3xl shadow-sm p-5">
        <h3 className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-3">Livreur</h3>
        {course.deliverer ? (
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
              {delivererName
                .split(" ")
                .filter(Boolean)
                .slice(0, 2)
                .map((s) => s[0])
                .join("")
                .toUpperCase() || <Truck className="w-5 h-5" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 truncate">{delivererName}</p>
              <p className="text-xs text-gray-500">{course.deliverer.reference}</p>
              {course.deliverer.phone && (
                <a
                  href={`tel:${course.deliverer.phone}`}
                  className="mt-1 inline-flex items-center gap-1 text-xs text-[#F17922] hover:underline"
                >
                  <Phone className="w-3 h-3" />
                  {course.deliverer.phone}
                </a>
              )}
            </div>
          </div>
        ) : (
          <p className="text-xs text-gray-400 italic">Aucun livreur assigné</p>
        )}
      </div>

      {/* Financial summary */}
      <div className="bg-white border border-gray-100 rounded-3xl shadow-sm p-5">
        <h3 className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-3">Récapitulatif</h3>
        <dl className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <dt className="text-gray-600">Livraisons</dt>
            <dd className="font-medium text-gray-900">{course.deliveries.length}</dd>
          </div>
          {course.estimated_duration_min && (
            <div className="flex items-center justify-between">
              <dt className="text-gray-600">Durée estimée</dt>
              <dd className="font-medium text-gray-900">{course.estimated_duration_min} min</dd>
            </div>
          )}
          {course.assigned_at && (
            <div className="flex items-center justify-between">
              <dt className="text-gray-600">Acceptée</dt>
              <dd className="font-medium text-gray-900">
                {format(new Date(course.assigned_at), "HH:mm", { locale: fr })}
              </dd>
            </div>
          )}
          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
            <dt className="text-gray-700 font-semibold">Total livraison</dt>
            <dd className="text-lg font-bold text-[#F17922]">{formatPrix(course.total_delivery_fee)}</dd>
          </div>
        </dl>
      </div>

      {/* Actions */}
      <div className="bg-white border border-gray-100 rounded-3xl shadow-sm p-5">
        <h3 className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-3">Actions</h3>
        <div className="space-y-2">
          {course.statut === "PENDING_ASSIGNMENT" && (
            <button
              onClick={() => toggleModal("courses", "force_assign")}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#F17922] text-white text-sm font-semibold hover:opacity-90 transition"
            >
              <UserPlus className="w-4 h-4" />
              Forcer l&apos;affectation
            </button>
          )}
          {course.statut === "EXPIRED" && (
            <button
              onClick={() => retryCourse(course.id)}
              disabled={isRetrying}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-green-600 text-white text-sm font-semibold hover:bg-green-700 transition disabled:opacity-60"
            >
              <RotateCw className={`w-4 h-4 ${isRetrying ? "animate-spin" : ""}`} />
              {isRetrying ? "Relance en cours…" : "Relancer la recherche"}
            </button>
          )}
          {!terminal && (
            <button
              onClick={() => toggleModal("courses", "cancel")}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-red-500 text-red-600 text-sm font-semibold hover:bg-red-50 transition"
            >
              <Ban className="w-4 h-4" />
              Annuler la course
            </button>
          )}
          {terminal && course.cancelled_reason && (
            <div className="flex items-start gap-2 rounded-xl bg-red-50 border border-red-200 px-3 py-2">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div className="text-xs">
                <p className="font-semibold text-red-800">Raison d&apos;annulation</p>
                <p className="text-red-700 mt-0.5">{course.cancelled_reason}</p>
              </div>
            </div>
          )}
          {terminal && !course.cancelled_reason && (
            <p className="text-xs text-gray-400 text-center py-2">
              Course terminée — aucune action disponible
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
