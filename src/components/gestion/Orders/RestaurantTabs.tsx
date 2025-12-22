"use client";

import React from "react";
import { useRestaurantListQuery } from "../../../../features/restaurants/queries/restaurant-list.query";

interface Restaurant {
  id: string;
  name: string;
}

interface RestaurantTabsProps {
  restaurants: Restaurant[];
  selectedRestaurant: string | null;
  onSelectRestaurant: (restaurantId: string | null) => void;
  showAllTab?: boolean;
}

const RestaurantTabs: React.FC<RestaurantTabsProps> = ({
  restaurants,
  selectedRestaurant,
  onSelectRestaurant,
  showAllTab = true,
}) => {
  const { data: restaurantsAll } = useRestaurantListQuery();
  console.log(restaurantsAll);
  return (
    <div className="mb-6 w-full">
      <div className="w-full overflow-x-auto">
        <div
          className="flex items-center bg-[#f4f4f5] rounded-[12px] px-2 w-fit min-w-full
          scrollbar-thin scrollbar-thumb-[#E4E4E7] scrollbar-track-transparent"
          style={{ minHeight: 40 }}
        >
          {showAllTab && (
            <button
              className={`transition-colors font-bold cursor-pointer text-[11px] lg:text-[14px]
                 px-3 sm:px-5 py-1 rounded-[12px] focus:outline-none whitespace-nowrap flex-shrink-0
                ${
                  selectedRestaurant === null
                    ? "bg-[#F17922] text-white font-bold shadow-none"
                    : "bg-transparent text-[#71717A] font-normal"
                }
              `}
              style={{ minWidth: 75, height: 30 }}
              onClick={() => onSelectRestaurant(null)}
            >
              Tous les restaurants
            </button>
          )}

          {restaurants.map((restaurant, idx) => (
            <button
              key={restaurant.id}
              className={`transition-colors font-bold cursor-pointer text-[11px] lg:text-[14px]
                 px-3 sm:px-5 py-1 rounded-[12px] focus:outline-none whitespace-nowrap flex-shrink-0
                ${
                  selectedRestaurant === restaurant.id
                    ? "bg-[#F17922] text-white font-bold shadow-none"
                    : "bg-transparent text-[#71717A] font-normal"
                }
                ml-1
              `}
              style={{ minWidth: 75, height: 30 }}
              onClick={() => onSelectRestaurant(restaurant.id)}
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
