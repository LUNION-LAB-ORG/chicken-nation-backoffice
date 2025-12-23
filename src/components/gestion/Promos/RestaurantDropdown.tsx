"use client"

import React, { useState, useRef, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'
import Checkbox from '@/components/ui/Checkbox'
import { Restaurant } from '@/services/restaurantService'

interface RestaurantDropdownProps {
  restaurants: Restaurant[]
  loading: boolean
  selectedRestaurants: string[]
  onRestaurantToggle: (restaurantId: string) => void
  onSelectAll: () => void
  getSelectedItemsDisplay: (selectedIds: string[], items: Array<{id?: string, name: string}>, maxDisplay?: number) => string | null
}

const RestaurantDropdown = ({
  restaurants,
  loading,
  selectedRestaurants,
  onRestaurantToggle,
  onSelectAll,
  getSelectedItemsDisplay
}: RestaurantDropdownProps) => {
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Effet pour fermer la dropdown quand on clique ailleurs
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setShowDropdown(!showDropdown)}
        className="w-full sm:w-170 px-4 py-2.5 border border-gray-300 rounded-xl text-left bg-white focus:outline-none focus:ring-2 focus:ring-[#F17922] flex items-center justify-between"
      >
        <div className="flex-1 min-w-0">
          {loading ? (
            <span className="text-gray-500">Chargement...</span>
          ) : selectedRestaurants.length === 0 ? (
            <span className="text-gray-500">Sélectionnez restaurant(s)</span>
          ) : (
            <div>
              <div className="text-gray-900 font-medium">
                {selectedRestaurants.length} restaurant{selectedRestaurants.length > 1 ? 's' : ''} sélectionné{selectedRestaurants.length > 1 ? 's' : ''}
              </div>
              <div className="text-xs text-gray-500 truncate">
                {getSelectedItemsDisplay(selectedRestaurants, restaurants)}
              </div>
            </div>
          )}
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
      </button>

      {showDropdown && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50 max-h-80 overflow-hidden">
          {/* Header avec "Tout sélectionner" */}
          <div className="p-3 border-b border-gray-100 bg-gray-50">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">
                {loading ? "Chargement..." : `${restaurants.length} restaurant${restaurants.length > 1 ? 's' : ''} disponible${restaurants.length > 1 ? 's' : ''}`}
              </span>
              {!loading && restaurants.length > 0 && (
                <button
                  type="button"
                  onClick={onSelectAll}
                  className="text-xs text-orange-600 hover:text-orange-700 font-medium"
                >
                  {selectedRestaurants.length === restaurants.length ? 'Tout désélectionner' : 'Tout sélectionner'}
                </button>
              )}
            </div>
          </div>

          {/* Liste des restaurants */}
          <div className="max-h-60 overflow-y-auto">
            {loading ? (
              <div className="px-4 py-3 text-gray-500 text-sm">Chargement des restaurants...</div>
            ) : restaurants.length === 0 ? (
              <div className="px-4 py-3 text-gray-500 text-sm">Aucun restaurant disponible</div>
            ) : (
              restaurants.map((restaurant) => (
                <div
                  key={restaurant.id}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                >
                  <Checkbox
                    checked={selectedRestaurants.includes(restaurant.id || '') || selectedRestaurants.includes(restaurant.id?.toString() || '')}
                    onChange={() => onRestaurantToggle(restaurant.id || '')}
                    id={`restaurant-${restaurant.id}`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 truncate">{restaurant.name}</div>
                    <div className="text-xs text-gray-500 truncate">{restaurant.address}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default RestaurantDropdown
