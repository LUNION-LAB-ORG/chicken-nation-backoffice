"use client";

import React from "react";
import { useRestaurantListQuery } from "../../../restaurants/queries/restaurant-list.query";
import { useDashboardStore } from "@/store/dashboardStore";

interface RestaurantTabsProps {
  showAllTab?: boolean;
}

const RestaurantTabs: React.FC<RestaurantTabsProps> = ({
  showAllTab = true,
}) => {
  const { selectedRestaurantId, setSelectedRestaurantId, setPagination } =
    useDashboardStore();

  const { data: restaurantsAll, isLoading } = useRestaurantListQuery();

  const restaurants = restaurantsAll?.data;

  const handleRestaurantChange = (restaurantId: string | null) => {
    setSelectedRestaurantId(restaurantId);
    setPagination("orders", 1, 10);
  };

  if (!showAllTab) return <></>;
  return (
    <div className="mb-6 w-full">
      <div className="w-full overflow-x-auto">
        <div
          className="flex items-center bg-[#f4f4f5] rounded-[12px] px-2 w-fit min-w-full
          scrollbar-thin scrollbar-thumb-[#E4E4E7] scrollbar-track-transparent"
          style={{ minHeight: 40 }}
        >
          <button
            className={`transition-colors font-bold cursor-pointer text-[11px] lg:text-[14px]
                 px-3 sm:px-5 py-1 rounded-[12px] focus:outline-none whitespace-nowrap flex-shrink-0
                ${
                  selectedRestaurantId === null
                    ? "bg-[#F17922] text-white font-bold shadow-none"
                    : "bg-transparent text-[#71717A] font-normal"
                }
              `}
            style={{ minWidth: 75, height: 30 }}
            onClick={() => handleRestaurantChange(null)}
          >
            Tous les restaurants
          </button>
          {!isLoading &&
            restaurants.map((restaurant) => (
              <button
                key={restaurant.id}
                className={`transition-colors font-bold cursor-pointer text-[11px] lg:text-[14px]
                 px-3 sm:px-5 py-1 rounded-[12px] focus:outline-none whitespace-nowrap flex-shrink-0
                ${
                  selectedRestaurantId === restaurant.id
                    ? "bg-[#F17922] text-white font-bold shadow-none"
                    : "bg-transparent text-[#71717A] font-normal"
                }
                ml-1
              `}
                style={{ minWidth: 75, height: 30 }}
                onClick={() => handleRestaurantChange(restaurant.id)}
              >
                {restaurant.name}
              </button>
            ))}
        </div>
      </div>
    </div>
  );
};

export default RestaurantTabs;
