"use client";

import React, { useEffect, useState } from "react";
import { Loader2, X } from "lucide-react";

import { useRegeneratePlanMutation } from "../queries/schedule.query";
import type { ISchedulePlan } from "../types/schedule.types";

interface Props {
  isOpen: boolean;
  plan: ISchedulePlan | null;
  onClose: () => void;
  /** Appelée avec l'ID du NOUVEAU plan régénéré (pour le sélectionner). */
  onRegenerated: (newPlanId: string) => void;
}

/**
 * Modal de réédition des dates d'un plan DRAFT/SENT.
 * Régénère un nouveau plan DRAFT pour les nouvelles dates (l'ancien est remplacé).
 */
export function EditDatesModal({ isOpen, plan, onClose, onRegenerated }: Props) {
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [error, setError] = useState<string | null>(null);

  const mutation = useRegeneratePlanMutation();

  useEffect(() => {
    if (isOpen && plan) {
      setPeriodStart(plan.period_start.substring(0, 10));
      setPeriodEnd(plan.period_end.substring(0, 10));
      setError(null);
    }
  }, [isOpen, plan]);

  if (!isOpen || !plan) return null;

  const handleSubmit = async () => {
    setError(null);
    if (!periodStart) {
      setError("Date de début requise");
      return;
    }
    try {
      const fresh = await mutation.mutateAsync({
        planId: plan.id,
        periodStart,
        periodEnd: periodEnd || undefined,
      });
      onRegenerated(fresh.id);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900">Modifier les dates</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <p className="text-xs text-gray-500 mb-4">
          Le plan sera <b>régénéré</b> pour les nouvelles dates et repassera en{" "}
          <b>brouillon</b>. Les ajustements manuels de repos seront recalculés.
        </p>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Date de début
            </label>
            <input
              type="date"
              value={periodStart}
              onChange={(e) => setPeriodStart(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Date de fin (optionnel)
            </label>
            <input
              type="date"
              value={periodEnd}
              onChange={(e) => setPeriodEnd(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
            />
            <p className="text-[11px] text-gray-500 mt-1">
              Si vide, calculée auto via <code>planning_period_weeks</code>.
            </p>
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-3">
              <p className="text-xs text-red-700">{error}</p>
            </div>
          )}
        </div>

        <div className="flex gap-2 mt-5">
          <button
            type="button"
            onClick={onClose}
            disabled={mutation.isPending}
            className="flex-1 py-2 rounded-lg border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={mutation.isPending}
            className="flex-1 inline-flex items-center justify-center gap-2 py-2 rounded-lg bg-[#F17922] text-white text-sm font-semibold hover:bg-[#D8631F] disabled:opacity-60"
          >
            {mutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            Régénérer
          </button>
        </div>
      </div>
    </div>
  );
}
