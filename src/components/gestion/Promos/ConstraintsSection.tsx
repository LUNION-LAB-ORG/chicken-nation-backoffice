"use client"

import React, { useState, useRef, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'
import Checkbox from '@/components/ui/Checkbox'

interface ConstraintsSectionProps {
  minOrderAmount: string
  onMinOrderAmountChange: (value: string) => void
  maxUsagePerClient: string
  onMaxUsagePerClientChange: (value: string) => void
  maxTotalUsage: string
  onMaxTotalUsageChange: (value: string) => void
  selectedPublicTypes: string[]
  onPublicTypeToggle: (type: string) => void
  onSelectAllPublicTypes: () => void
  showPublicDropdown: boolean
  onShowPublicDropdownChange: (show: boolean) => void
  publicTypeOptions: string[]
}

const ConstraintsSection = ({
  minOrderAmount,
  onMinOrderAmountChange,
  maxUsagePerClient,
  onMaxUsagePerClientChange,
  maxTotalUsage,
  onMaxTotalUsageChange,
  selectedPublicTypes,
  onPublicTypeToggle,
  // onSelectAllPublicTypes, // Non utilisé actuellement
  showPublicDropdown,
  onShowPublicDropdownChange,
  publicTypeOptions
}: ConstraintsSectionProps) => {
  const publicDropdownRef = useRef<HTMLDivElement>(null)
  const [showPrivateDropdown, setShowPrivateDropdown] = useState(false)

  // Effet pour fermer la dropdown quand on clique ailleurs
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (publicDropdownRef.current && !publicDropdownRef.current.contains(event.target as Node)) {
        onShowPublicDropdownChange(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [onShowPublicDropdownChange])

  return (
    <div className="mt-8">
      <h3 className="text-[#F17922] font-medium mb-6">Contraintes et limites</h3>

      {/* Grille des champs contraintes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
        <div className="flex flex-row items-center justify-between">
          <label className="block text-sm text-gray-600 mb-2">Commande minimum (XOF)</label>
          <input
            type="text"
            placeholder="Ex: 5 000"
            value={minOrderAmount}
            onChange={(e) => onMinOrderAmountChange(e.target.value)}
            className="w-90 px-4 py-3 border border-gray-300 rounded-xl text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#F17922]"
          />
        </div>
        <div className="flex flex-row items-center justify-between">
          <label className="block text-sm text-gray-600 mb-2">Utilisation max par client</label>
          <input
            type="text"
            placeholder="Ex: 5"
            value={maxUsagePerClient}
            onChange={(e) => onMaxUsagePerClientChange(e.target.value)}
            className="w-90 px-4 py-3 border border-gray-300 rounded-xl text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#F17922]"
          />
        </div>
        <div className="flex flex-row items-center justify-between">
          <label className="block text-sm text-gray-600 mb-2">Utilisation totale maximum</label>
          <input
            type="text"
            placeholder="Illimité"
            value={maxTotalUsage}
            onChange={(e) => onMaxTotalUsageChange(e.target.value)}
            className="w-90 px-4 py-3 border border-gray-300 rounded-xl text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#F17922]"
          />
        </div>
        <div className="flex flex-row items-center justify-between gap-6">
          <label className="block text-sm text-gray-600 mb-2">Visibilité</label>
          <div className="relative w-90" ref={publicDropdownRef}>
            <button
              type="button"
              onClick={() => onShowPublicDropdownChange(!showPublicDropdown)}
              className="w-full p-4 py-3 rounded-xl cursor-pointer flex justify-between items-center transition-colors focus:bg-[#ff6200] border-gray-200 border-1 focus:border-[#F17922] bg-white hover:bg-[#ff6200]"
            >
              <div className="flex-1 min-w-0">
                <span className="text-sm text-slate-600 font-medium">Sélectionner visibilité</span>
              </div>
              <div className="flex items-center gap-2">
                {selectedPublicTypes.length > 0 && (
                  <span className="text-xs bg-orange-100 text-orange-600 px-2 py-1 rounded-full">
                    {selectedPublicTypes.length} sélectionné{selectedPublicTypes.length > 1 ? 's' : ''}
                  </span>
                )}
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showPublicDropdown ? 'rotate-180' : ''}`} />
              </div>
            </button>

            {showPublicDropdown && (
              <div className="absolute bottom-full left-0 right-0 mb-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50 max-h-80 overflow-hidden">
                {/* Option Public */}
                <button
                  type="button"
                  onClick={() => onPublicTypeToggle('Public')}
                  className={`w-full flex items-center px-4 py-3 border-b border-gray-100 transition-colors cursor-pointer text-left text-gray-900 ${
                    selectedPublicTypes.includes('Public')
                      ? 'bg-[#ff6200]'
                      : 'hover:bg-[#ff6200]'
                  }`}
                >
                  <span className="text-gray-700">Public</span>
                </button>

                {/* Option Privé avec dropdown imbriquée */}
                <div className="border-b border-gray-100 last:border-b-0">
                  <button
                    type="button"
                    onClick={() => setShowPrivateDropdown(!showPrivateDropdown)}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-[#ff6200] transition-colors cursor-pointer text-left text-gray-900"
                  >
                    <span className="text-gray-700 font-medium">Privé</span>
                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showPrivateDropdown ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Sous-dropdown pour les types privés */}
                  {showPrivateDropdown && (
                    <div className="bg-gray-50 border-t border-gray-100">
                      {publicTypeOptions.map((publicType) => (
                        <div
                          key={publicType}
                          className={`flex items-center gap-3 px-6 py-3 transition-colors ${
                            selectedPublicTypes.includes(publicType)
                              ? 'bg-[#ff6200]'
                              : 'hover:bg-[#ff6200]'
                          }`}
                        >
                          <Checkbox
                            checked={selectedPublicTypes.includes(publicType)}
                            onChange={() => onPublicTypeToggle(publicType)}
                            id={`private-${publicType}`}
                          />
                          <span className="text-gray-700">{publicType}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ConstraintsSection
