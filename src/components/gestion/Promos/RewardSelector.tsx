"use client"

import React, { useState, useRef, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'
import Checkbox from '@/components/ui/Checkbox'
import Image from 'next/image'
import { formatImageUrl } from '@/utils/imageHelpers'
import { MenuItem } from '@/types'

interface RewardSelectorProps {
  menus: MenuItem[]
  loadingMenus: boolean
  selectedRewardMenus: string[]
  onRewardMenuToggle: (menuId: string) => void
  onSelectAllRewardMenus: () => void
  getSelectedItemsDisplay: (selectedIds: string[], items: Array<{id?: string, name: string}>, maxDisplay?: number) => string | null
}

const RewardSelector = ({
  menus,
  loadingMenus,
  selectedRewardMenus,
  onRewardMenuToggle,
  onSelectAllRewardMenus,
  getSelectedItemsDisplay
}: RewardSelectorProps) => {
  const [showRewardDropdown, setShowRewardDropdown] = useState(false)
  const rewardDropdownRef = useRef<HTMLDivElement>(null)

  // Effet pour fermer la dropdown quand on clique ailleurs
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (rewardDropdownRef.current && !rewardDropdownRef.current.contains(event.target as Node)) {
        setShowRewardDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  return (
    <div className="mb-8">
      <h3 className="text-[#F17922] font-medium mb-6">Récompense</h3>

      {/* Dropdown des menus pour la récompense */}
      <div className="relative" ref={rewardDropdownRef}>
        <button
          type="button"
          onClick={() => setShowRewardDropdown(!showRewardDropdown)}
          className="w-full p-4 rounded-xl cursor-pointer flex justify-between items-start transition-colors focus:bg-[#ff6200] focus:border-2 border-1 border-gray-200 focus:border-[#F17922]"
        >
          <div className="flex-1 min-w-0">
            <span className="text-sm text-slate-600 font-medium">Sélectionnez produits</span>
            {selectedRewardMenus.length > 0 && (
              <div className="text-xs text-gray-500 truncate mt-1">
                {getSelectedItemsDisplay(selectedRewardMenus, menus)}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            {selectedRewardMenus.length > 0 && (
              <span className="text-xs bg-orange-100 text-orange-600 px-2 py-1 rounded-full">
                {selectedRewardMenus.length} sélectionné{selectedRewardMenus.length > 1 ? 's' : ''}
              </span>
            )}
            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showRewardDropdown ? 'rotate-180' : ''}`} />
          </div>
        </button>

        {showRewardDropdown && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50 max-h-80 overflow-hidden">
            {/* Header avec "Tout sélectionner" */}
            <div className="p-3 border-b border-gray-100 bg-gray-50">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">
                  {loadingMenus ? "Chargement..." : `${menus.length} menu${menus.length > 1 ? 's' : ''} disponible${menus.length > 1 ? 's' : ''}`}
                </span>
                {!loadingMenus && menus.length > 0 && (
                  <button
                    type="button"
                    onClick={onSelectAllRewardMenus}
                    className="text-xs text-orange-600 hover:text-orange-700 font-medium"
                  >
                    {selectedRewardMenus.length === menus.length ? 'Tout désélectionner' : 'Tout sélectionner'}
                  </button>
                )}
              </div>
            </div>

            {/* Liste des menus */}
            <div className="max-h-60 overflow-y-auto">
              {loadingMenus ? (
                <div className="px-4 py-3 text-gray-500 text-sm">Chargement des menus...</div>
              ) : menus.length === 0 ? (
                <div className="px-4 py-3 text-gray-500 text-sm">Aucun menu disponible</div>
              ) : (
                menus.map((menu) => (
                  <div
                    key={menu.id}
                    className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-12 h-12 bg-gray-200 rounded-lg flex-shrink-0 overflow-hidden">
                        <Image
                          src={formatImageUrl(menu.image)}
                          alt={menu.name}
                          width={48}
                          height={48}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = '/images/placeholder-food.jpg';
                          }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 truncate">{menu.name}</div>
                        <div className="text-xs text-gray-500 truncate">{menu.description}</div>
                        <div className="text-xs text-orange-600 font-medium">{menu.price} FCFA</div>
                      </div>
                    </div>
                    <Checkbox
                      checked={selectedRewardMenus.includes(menu.id)}
                      onChange={() => onRewardMenuToggle(menu.id)}
                      id={`reward-menu-${menu.id}`}
                    />
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default RewardSelector
