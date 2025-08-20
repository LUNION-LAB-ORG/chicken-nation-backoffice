"use client"

import React, { useState } from 'react'
import { ChevronDown } from 'lucide-react'

type ViewType = 'products' | 'categories'

interface InventoryPageHeaderProps {
  onViewChange: (view: ViewType) => void
}

export default function InventoryPageHeader({ onViewChange }: InventoryPageHeaderProps) {
  const [currentView, setCurrentView] = useState<ViewType>('products')
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  const handleViewChange = (view: ViewType) => {
    setCurrentView(view)
    setIsDropdownOpen(false)
    onViewChange(view)
  }

  return (
    <div className="flex items-center gap-6 mb-6">
      {/* Dropdown */}
      <div className="relative">
        <button 
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="flex items-center gap-2 bg-white rounded-[10px] px-4 py-2 shadow-sm"
        >
          <span className="text-[13px] text-gray-900">
            {currentView === 'products' ? 'Produits' : 'Catégories'}
          </span>
          <ChevronDown className="h-4 w-4 text-gray-500" />
        </button>

        {/* Dropdown Menu */}
        {isDropdownOpen && (
          <div className="absolute top-full left-0 mt-1 w-40 bg-white rounded-[10px] shadow-lg py-1 z-10">
            <button
              onClick={() => handleViewChange('products')}
              className="w-full px-4 py-2 text-left text-[13px] text-gray-900 hover:bg-gray-50"
            >
              Produits
            </button>
            <button
              onClick={() => handleViewChange('categories')}
              className="w-full px-4 py-2 text-left text-[13px] text-gray-900 hover:bg-gray-50"
            >
              Catégories
            </button>
          </div>
        )}
      </div>

      {/* Titre */}
      <div className="bg-[#F17922] rounded-[10px] px-4 py-2">
        <span className="text-[13px] text-white font-medium">
          {currentView === 'products' ? 'Tous les produits' : 'Toutes les catégories'}
        </span>
      </div>
    </div>
  )
}
