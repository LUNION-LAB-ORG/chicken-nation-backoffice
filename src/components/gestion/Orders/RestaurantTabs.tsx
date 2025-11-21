"use client"

import React from 'react'

interface Restaurant {
  id: string
  name: string
}

interface RestaurantTabsProps {
  restaurants: Restaurant[]
  selectedRestaurant: string | null
  onSelectRestaurant: (restaurantId: string | null) => void
  showAllTab?: boolean
}

const RestaurantTabs: React.FC<RestaurantTabsProps> = ({
  restaurants,
  selectedRestaurant,
  onSelectRestaurant,
  showAllTab = true
}) => {


  return (
    <div className="mb-6">
      <div
        className="flex items-center bg-[#f4f4f5] rounded-[12px] px-2 w-fit
        overflow-x-auto scrollbar-thin scrollbar-thumb-[#E4E4E7]
        scrollbar-track-transparent"
        style={{ minHeight: 40 }}
      >
        {/* Tab "Tous les restaurants" (visible seulement pour ADMIN) */}
        {showAllTab && (
          <button
            className={`transition-colors font-bold cursor-pointer text-[11px] lg:text-[14px]
               px-5 py-1 rounded-[12px] focus:outline-none whitespace-nowrap
              ${selectedRestaurant === null
                ? 'bg-[#F17922] text-white font-bold shadow-none'
                : 'bg-transparent text-[#71717A] font-normal'}
            `}
            style={{ minWidth: 75, height: 30 }}
            onClick={() => onSelectRestaurant(null)}
          >
            Tous les restaurants
          </button>
        )}

        {/* Tabs pour chaque restaurant */}
        {restaurants.map((restaurant, idx) => (
          <button
            key={restaurant.id}
            className={`transition-colors font-bold cursor-pointer text-[11px] lg:text-[14px]
               px-5 py-1 rounded-[12px] focus:outline-none whitespace-nowrap
              ${selectedRestaurant === restaurant.id
                ? 'bg-[#F17922] text-white font-bold shadow-none'
                : 'bg-transparent text-[#71717A] font-normal'}
              ${(idx === 0 && !showAllTab) || (idx > 0 || showAllTab) ? 'ml-1' : ''}
            `}
            style={{ minWidth: 75, height: 30 }}
            onClick={() => onSelectRestaurant(restaurant.id)}
          >
            {restaurant.name}
          </button>
        ))}
      </div>
    </div>
  )
}

export default RestaurantTabs
