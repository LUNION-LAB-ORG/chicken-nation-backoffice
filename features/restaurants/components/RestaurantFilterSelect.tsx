"use client";

import { Store } from "lucide-react";
import { useMemo } from "react";
import { useRestaurantListQuery } from "../queries/restaurant-list.query";

interface RestaurantFilterSelectProps {
  /** Restaurant sélectionné ("" = tous les restaurants). */
  value: string;
  onChange: (restaurantId: string) => void;
  className?: string;
}

/**
 * Sélecteur de restaurant réutilisable (filtre "Tous les restaurants" + liste).
 * Récupère les restaurants via `useRestaurantListQuery`. Contrôlé via value/onChange.
 */
export function RestaurantFilterSelect({
  value,
  onChange,
  className,
}: RestaurantFilterSelectProps) {
  const { data: restaurantsResp } = useRestaurantListQuery();
  const restaurants = useMemo(
    () => (restaurantsResp?.data ?? []) as { id: string; name: string }[],
    [restaurantsResp],
  );

  return (
    <div
      className={`flex items-center gap-2 border rounded-xl px-3 py-1.5 bg-white shrink-0 ${className ?? ""}`}
    >
      <Store
        className={`w-4 h-4 shrink-0 ${value ? "text-[#F17922]" : "text-gray-400"}`}
      />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="text-sm bg-transparent outline-none cursor-pointer max-w-[220px] text-gray-700"
      >
        <option value="">Tous les restaurants</option>
        {restaurants.map((r) => (
          <option key={r.id} value={r.id}>
            {r.name}
          </option>
        ))}
      </select>
    </div>
  );
}
