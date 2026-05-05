"use client";

import React, { useState } from "react";
import { Loader2, X } from "lucide-react";

import { useRestaurantListQuery } from "../../restaurants/queries/restaurant-list.query";
import { useGeneratePlanMutation } from "../queries/schedule.query";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  defaultRestaurantId?: string;
  /** Appelée avec l'ID du plan généré pour le sélectionner immédiatement. */
  onGenerated: (planId: string) => void;
}

/**
 * Modal de génération d'un plan DRAFT.
 *
 * Champs :
 *   - Restaurant (UUID — pré-rempli si fourni en prop)
 *   - Date de début (input date)
 *   - Date de fin (optionnel — sinon calculée auto via planning_period_weeks)
 *
 * Au succès : appelle `onGenerated(planId)` pour sélectionner le plan créé.
 */
export function GeneratePlanModal({
  isOpen,
  onClose,
  defaultRestaurantId,
  onGenerated,
}: Props) {
  const [restaurantId, setRestaurantId] = useState(defaultRestaurantId ?? "");
  const [periodStart, setPeriodStart] = useState(getNextMonday());
  const [periodEnd, setPeriodEnd] = useState("");
  const [error, setError] = useState<string | null>(null);

  const mutation = useGeneratePlanMutation();

  React.useEffect(() => {
    if (isOpen) {
      setRestaurantId(defaultRestaurantId ?? "");
      setPeriodStart(getNextMonday());
      setPeriodEnd("");
      setError(null);
    }
  }, [isOpen, defaultRestaurantId]);

  const handleSubmit = async () => {
    setError(null);
    if (!restaurantId.trim()) {
      setError("Restaurant requis");
      return;
    }
    if (!periodStart) {
      setError("Date de début requise");
      return;
    }
    try {
      const plan = await mutation.mutateAsync({
        restaurantId: restaurantId.trim(),
        periodStart,
        periodEnd: periodEnd || undefined,
      });
      onGenerated(plan.id);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900">Générer un plan</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="space-y-3">
          <Field label="Restaurant">
            <RestaurantSelect value={restaurantId} onChange={setRestaurantId} />
          </Field>

          <Field label="Date de début">
            <input
              type="date"
              value={periodStart}
              onChange={(e) => setPeriodStart(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
            />
          </Field>

          <Field label="Date de fin (optionnel)">
            <input
              type="date"
              value={periodEnd}
              onChange={(e) => setPeriodEnd(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
            />
            <p className="text-[11px] text-gray-500 mt-1">
              Si vide, calculée auto via le setting <code>planning_period_weeks</code>.
            </p>
          </Field>

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
            Générer
          </button>
        </div>
      </div>
    </div>
  );
}

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div>
    <label className="block text-xs font-semibold text-gray-700 mb-1">{label}</label>
    {children}
  </div>
);

function getNextMonday(): string {
  const d = new Date();
  const day = d.getDay();
  const daysUntilMonday = day === 1 ? 7 : (8 - day) % 7;
  d.setDate(d.getDate() + daysUntilMonday);
  return d.toISOString().substring(0, 10);
}

const RestaurantSelect: React.FC<{
  value: string;
  onChange: (id: string) => void;
}> = ({ value, onChange }) => {
  const { data, isLoading } = useRestaurantListQuery();
  const restaurants = data?.data ?? [];
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={isLoading}
      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
    >
      <option value="" disabled>
        {isLoading ? "Chargement…" : "Sélectionne un restaurant"}
      </option>
      {restaurants.map((r) => (
        <option key={r.id} value={r.id}>{r.name}</option>
      ))}
    </select>
  );
};
