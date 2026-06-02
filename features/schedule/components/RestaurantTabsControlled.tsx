"use client";

import React from "react";

import { useRestaurantListQuery } from "../../restaurants/queries/restaurant-list.query";

interface RestaurantTabsControlledProps {
  value: string;
  onChange: (restaurantId: string) => void;
}

/**
 * Tabs restaurants CONTRÔLÉES (value / onChange) — pilotées par le parent,
 * contrairement à celles des Commandes (câblées au dashboardStore). Utilisées
 * par le Planning, où un restaurant est toujours sélectionné (un plan = un resto).
 * Style aligné sur les tabs des Commandes.
 */
const RestaurantTabsControlled: React.FC<RestaurantTabsControlledProps> = ({
  value,
  onChange,
}) => {
  const { data, isLoading } = useRestaurantListQuery();
  const restaurants = data?.data ?? [];

  if (isLoading) {
    return <div className="h-10 w-full bg-[#f4f4f5] rounded-[12px] animate-pulse" />;
  }

  return (
    <div className="w-full overflow-x-auto">
      <div
        className="flex items-center bg-[#f4f4f5] rounded-[12px] px-2 w-fit min-w-full"
        style={{ minHeight: 40 }}
      >
        {restaurants.map((r) => (
          <button
            key={r.id}
            type="button"
            onClick={() => onChange(r.id)}
            className={`transition-colors cursor-pointer text-[11px] lg:text-[14px] px-3 sm:px-5 py-1 rounded-[12px] focus:outline-none whitespace-nowrap flex-shrink-0 ml-1 first:ml-0 ${
              value === r.id
                ? "bg-[#F17922] text-white font-bold"
                : "bg-transparent text-[#71717A] font-normal"
            }`}
            style={{ minWidth: 75, height: 30 }}
          >
            {r.name}
          </button>
        ))}
      </div>
    </div>
  );
};

export default RestaurantTabsControlled;
