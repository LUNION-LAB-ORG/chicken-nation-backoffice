"use client";

import React, { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { Store } from "lucide-react";
import { useSettingQuery, useSettingMutation } from "@/hooks/useSettingsQuery";
import { useRestaurantListQuery } from "../../../../../features/restaurants/queries/restaurant-list.query";

const KEY = "delivery.service_by_restaurant";

/** "" = suivre le service par défaut (pas de surcharge stockée). */
const SERVICE_OPTIONS = [
  { value: "", label: "Par défaut" },
  { value: "TURBO", label: "Turbo (prestataire externe)" },
  { value: "CHICKEN_NATION", label: "Chicken Nation (coursier interne)" },
  { value: "FREE", label: "Gratuit / interne" },
];

/**
 * Surcharge du service de livraison PAR RESTAURANT (commandes auto de l'app).
 * Stocké en JSON dans `delivery.service_by_restaurant` : { restaurantId: service }.
 * Un restaurant sans surcharge suit « Service par défaut » ci-dessus.
 */
export default function ServiceByRestaurantSection() {
  const { data: setting, isLoading: settingLoading } = useSettingQuery(KEY);
  const { mutate: updateSetting, isPending } = useSettingMutation();
  const { data: restaurantsResp, isLoading: restosLoading } = useRestaurantListQuery({
    limit: 100,
  });
  const restaurants = ((restaurantsResp?.data ?? []) as { id: string; name: string }[]) || [];

  const [overrides, setOverrides] = useState<Record<string, string>>({});
  useEffect(() => {
    if (setting?.value) {
      try {
        setOverrides(JSON.parse(setting.value) ?? {});
      } catch {
        setOverrides({});
      }
    }
  }, [setting]);

  const setFor = (restaurantId: string, service: string) => {
    setOverrides((prev) => {
      const next = { ...prev };
      if (service) next[restaurantId] = service;
      else delete next[restaurantId]; // « Par défaut » = pas de surcharge
      return next;
    });
  };

  const save = () =>
    updateSetting(
      {
        key: KEY,
        value: JSON.stringify(overrides),
        description:
          "Surcharge du service de livraison par restaurant (commandes auto de l'app) : { restaurantId: TURBO | CHICKEN_NATION | FREE }. Restaurant absent = service par défaut.",
      },
      { onSuccess: () => toast.success("Services par restaurant enregistrés") },
    );

  const overriddenCount = Object.keys(overrides).length;
  const loading = settingLoading || restosLoading;

  return (
    <div className="mb-10">
      <div className="mb-1 flex items-center gap-2">
        <Store className="h-4 w-4 text-[#F17922]" />
        <h3 className="font-semibold text-[#F17922]">Service par restaurant</h3>
      </div>
      <p className="mb-4 text-sm text-slate-500">
        Surcharge du service de livraison pour chaque restaurant. « Par défaut » = suit le
        « Service par défaut (commandes auto) » ci-dessus.
        {overriddenCount > 0 ? ` ${overriddenCount} surcharge(s) active(s).` : ""}
      </p>

      {loading ? (
        <p className="py-4 text-sm text-slate-400">Chargement…</p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200">
          {restaurants.map((r, i) => (
            <div
              key={r.id}
              className={`flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:justify-between ${
                i > 0 ? "border-t border-slate-100" : ""
              } ${overrides[r.id] ? "bg-orange-50/50" : "bg-white"}`}
            >
              <span className="text-sm font-medium text-slate-700">{r.name}</span>
              <select
                value={overrides[r.id] ?? ""}
                onChange={(e) => setFor(r.id, e.target.value)}
                aria-label={`Service de livraison de ${r.name}`}
                className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm sm:w-72"
              >
                {SERVICE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          ))}
          {restaurants.length === 0 && (
            <p className="p-4 text-sm text-slate-400">Aucun restaurant</p>
          )}
        </div>
      )}

      <div className="mt-3 flex justify-end">
        <button
          type="button"
          onClick={save}
          disabled={isPending || loading}
          className="h-10 rounded-xl bg-[#F17922] px-5 text-sm font-medium text-white hover:bg-[#e06a15] disabled:opacity-50"
        >
          {isPending ? "Enregistrement…" : "Enregistrer les services"}
        </button>
      </div>
    </div>
  );
}
