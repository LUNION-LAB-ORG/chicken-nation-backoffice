"use client";

import React, { useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { CheckCircle2, Loader2, Sun, XCircle, Moon, AlertCircle, UserPlus, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getAllLivreurs } from "../../livreurs/services/livreur.service";

import {
  useSchedulePlanDetailQuery,
  useSchedulePlanStatsQuery,
  useSetDelivererDayMutation,
  useAddDelivererToPlanMutation,
} from "../queries/schedule.query";
import type {
  IShift,
  IShiftAssignment,
  ShiftAssignmentStatus,
} from "../types/schedule.types";

const STATUS_COLOR: Record<ShiftAssignmentStatus, { bg: string; color: string; icon: React.FC<{ className?: string }> }> = {
  ASSIGNED: { bg: "#FEF3C7", color: "#92400E", icon: AlertCircle },
  CONFIRMED: { bg: "#DCFCE7", color: "#166534", icon: CheckCircle2 },
  REFUSED: { bg: "#FEE2E2", color: "#991B1B", icon: XCircle },
};

interface Props {
  planId: string;
}

/**
 * Détail d'un plan : stats live + matrice livreur×jours avec shifts matin/soir.
 *
 * Affichage matriciel :
 *   - Colonnes = jours du plan
 *   - Lignes = livreurs (extraits de toutes les assignments)
 *   - Cellules = badges matin (jaune)/soir (bleu) avec statut visible
 */
export function SchedulePlanDetail({ planId }: Props) {
  const { data: plan, isLoading } = useSchedulePlanDetailQuery(planId);
  const { data: stats } = useSchedulePlanStatsQuery(planId);
  const dayMut = useSetDelivererDayMutation();
  const addMut = useAddDelivererToPlanMutation();
  const [showAdd, setShowAdd] = useState(false);
  // Livreurs du restaurant (pour en ajouter un au plan) — chargé à l'ouverture du modal.
  const { data: deliverersData } = useQuery({
    queryKey: ["livreurs-by-resto", plan?.restaurant.id],
    queryFn: () => getAllLivreurs({ restaurant_id: plan!.restaurant.id }),
    enabled: showAdd && !!plan?.restaurant.id,
  });

  // Index : pour chaque (delivererId, dateKey, shiftType), retrouver l'assignment
  const matrix = useMemo(() => {
    if (!plan) return null;
    const days = new Set<string>();
    const delivererMap = new Map<string, { id: string; firstName: string | null; lastName: string | null; image: string | null }>();
    const cellMap = new Map<string, IShiftAssignment & { shift: IShift }>();

    for (const shift of plan.shifts) {
      days.add(shift.date);
      for (const a of shift.assignments) {
        delivererMap.set(a.deliverer.id, {
          id: a.deliverer.id,
          firstName: a.deliverer.first_name,
          lastName: a.deliverer.last_name,
          image: a.deliverer.image,
        });
        cellMap.set(`${a.deliverer.id}|${shift.date}|${shift.type}`, { ...a, shift });
      }
    }

    return {
      days: [...days].sort(),
      deliverers: [...delivererMap.values()].sort((a, b) =>
        (a.firstName ?? "").localeCompare(b.firstName ?? ""),
      ),
      cellMap,
    };
  }, [plan]);

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-12 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-[#F17922]" />
      </div>
    );
  }

  if (!plan || !matrix) {
    return (
      <div className="bg-white rounded-2xl border border-red-200 p-6 text-center">
        <p className="text-sm text-red-700">Impossible de charger le plan.</p>
      </div>
    );
  }

  const isEditable = plan.status !== "ARCHIVED";
  const periodLabel = `${format(parseISO(plan.period_start), "dd MMM", { locale: fr })} → ${format(parseISO(plan.period_end), "dd MMM yyyy", { locale: fr })}`;

  // Livreurs du restaurant pas encore dans le plan (candidats à l'ajout).
  const inPlanIds = new Set(matrix.deliverers.map((d) => d.id));
  // getAllLivreurs renvoie { items, total, page, ... } → l'array est sous `items`.
  const eligible = (deliverersData?.items ?? []).filter((d) => !inPlanIds.has(d.id));

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100 flex items-start justify-between">
        <div>
          <h3 className="text-lg font-bold text-gray-900">{plan.restaurant.name}</h3>
          <p className="text-xs text-gray-500">{periodLabel}</p>
        </div>
        <div className="flex items-center gap-3">
          {stats && (
            <div className="flex items-center gap-2 text-xs">
              <StatChip label="Confirmés" count={stats.confirmed} color="#166534" bg="#DCFCE7" />
              <StatChip label="En attente" count={stats.pending} color="#92400E" bg="#FEF3C7" />
              <StatChip label="Refusés" count={stats.refused} color="#991B1B" bg="#FEE2E2" />
            </div>
          )}
          <button
            type="button"
            onClick={() => setShowAdd(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#F17922] text-white text-xs font-semibold px-3 py-2 hover:bg-[#e06816] whitespace-nowrap"
            title="Ajouter un livreur rattaché après la génération du plan"
          >
            <UserPlus className="w-3.5 h-3.5" /> Livreur
          </button>
        </div>
      </div>

      {isEditable && (
        <div className="px-5 py-2 bg-orange-50 border-b border-orange-100 text-[11px] text-[#92400E]">
          Clique une cellule pour basculer <b>repos ↔ travail</b> (repos interdit ven/sam/dim).
          {plan.status !== "DRAFT" &&
            " Les modifications s'appliquent immédiatement au planning en cours."}
        </div>
      )}

      {/* Matrice */}
      <div className="overflow-x-auto">
        <table className="min-w-full text-xs">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-2 font-semibold text-gray-600 sticky left-0 bg-gray-50 z-10 min-w-[140px]">
                Livreur
              </th>
              {matrix.days.map((day) => (
                <th key={day} className="text-center p-2 font-semibold text-gray-600 min-w-[80px]">
                  {format(parseISO(day), "EEE dd/MM", { locale: fr })}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {matrix.deliverers.map((d) => (
              <tr key={d.id} className="border-t border-gray-100 hover:bg-gray-50/50">
                <td className="p-2 font-medium text-gray-800 sticky left-0 bg-white hover:bg-gray-50/50">
                  {d.firstName ?? ""} {d.lastName ?? ""}
                </td>
                {matrix.days.map((day) => {
                  const morning = matrix.cellMap.get(`${d.id}|${day}|MORNING`);
                  const evening = matrix.cellMap.get(`${d.id}|${day}|EVENING`);
                  const hasWork = !!morning || !!evening;
                  return (
                    <td
                      key={day}
                      onClick={
                        isEditable && !dayMut.isPending
                          ? () =>
                              dayMut.mutate({
                                planId,
                                delivererId: d.id,
                                date: day,
                                mode: hasWork ? "REST" : "WORK",
                              })
                          : undefined
                      }
                      title={
                        isEditable ? (hasWork ? "Mettre en repos" : "Faire travailler") : undefined
                      }
                      className={`p-1 text-center align-top ${
                        isEditable ? "cursor-pointer hover:bg-orange-50" : ""
                      }`}
                    >
                      <div className="flex flex-col items-center gap-0.5">
                        {morning && <ShiftBadge assignment={morning} type="MORNING" />}
                        {evening && <ShiftBadge assignment={evening} type="EVENING" />}
                        {!morning && !evening && (
                          <span className="text-gray-300 text-[10px]">—</span>
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {matrix.deliverers.length === 0 && (
        <p className="text-sm text-gray-500 italic text-center p-8">
          Aucune affectation dans ce plan.
        </p>
      )}

      {/* Modal : ajouter un livreur au plan existant (incrémental) */}
      {showAdd && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setShowAdd(false)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-sm max-h-[80vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h4 className="font-bold text-gray-900">Ajouter un livreur</h4>
              <button
                onClick={() => setShowAdd(false)}
                className="text-gray-400 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-3 overflow-y-auto">
              {eligible.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-8">
                  Aucun livreur à ajouter (tous déjà dans le plan).
                </p>
              ) : (
                <div className="flex flex-col gap-1">
                  {eligible.map((d) => (
                    <button
                      key={d.id}
                      disabled={addMut.isPending}
                      onClick={() =>
                        addMut.mutate(
                          { planId, delivererId: d.id },
                          { onSuccess: () => setShowAdd(false) },
                        )
                      }
                      className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-orange-50 text-left disabled:opacity-50"
                    >
                      <span className="text-sm font-medium text-gray-800">
                        {d.first_name ?? ""} {d.last_name ?? ""}
                      </span>
                      <span className="text-xs font-semibold text-[#F17922]">Ajouter</span>
                    </button>
                  ))}
                </div>
              )}
              <p className="text-[11px] text-gray-400 mt-3 px-1">
                Le livreur est ajouté au planning existant (les affectations des autres
                livreurs ne changent pas).
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const ShiftBadge: React.FC<{ assignment: IShiftAssignment; type: "MORNING" | "EVENING" }> = ({
  assignment,
  type,
}) => {
  const meta = STATUS_COLOR[assignment.status];
  const Icon = type === "MORNING" ? Sun : Moon;
  return (
    <div
      className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-semibold"
      style={{ backgroundColor: meta.bg, color: meta.color }}
      title={`${type === "MORNING" ? "Matin" : "Soir"} — ${assignment.status}`}
    >
      <Icon className="w-2.5 h-2.5" />
      <meta.icon className="w-2.5 h-2.5" />
    </div>
  );
};

const StatChip: React.FC<{ label: string; count: number; color: string; bg: string }> = ({
  label,
  count,
  color,
  bg,
}) => (
  <span
    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-semibold"
    style={{ backgroundColor: bg, color }}
  >
    {label} {count}
  </span>
);
