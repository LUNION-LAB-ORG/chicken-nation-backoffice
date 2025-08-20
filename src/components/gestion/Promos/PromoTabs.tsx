"use client"

import React from 'react'
import { useRBAC } from '@/hooks/useRBAC'

interface PromoTabsProps {
  activeTab: string
  onTabChange: (tab: string) => void
  onCreatePromo?: () => void
  className?: string
}

const PromoTabs = ({ activeTab, onTabChange, onCreatePromo, className = '' }: PromoTabsProps) => {
  const { canCreateOffreSpeciale } = useRBAC()

  const tabs = [
    { id: 'all', label: 'Toutes les promos' },
    { id: 'public', label: 'Public' },
    { id: 'private', label: 'Privées' },
    { id: 'expired', label: 'Expirées' }
  ]

  // ✅ RBAC: Vérifier les permissions pour créer une promotion
  const canAddPromo = canCreateOffreSpeciale() && onCreatePromo

  return (
    <div className={className}>
      {/* Titre de la section */}
      <div className="flex justify-between items-center mb-6">
        <h2 className='text-[#F17922] text-[26px] font-regular'>Gestions des promotions</h2>
        {canAddPromo && (
          <button
            type="button"
            className="px-6 py-2 bg-[#F17922] cursor-pointer text-white text-sm font-medium rounded-2xl hover:bg-[#F17922] transition-colors"
            onClick={onCreatePromo}
          >
            Ajouter une promo
          </button>
        )}
      </div>

      {/* Onglets de filtrage */}
      <div className="flex space-x-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id)}
            className={`
              px-4 py-1 cursor-pointer rounded-xl text-sm font-medium transition-all duration-200
              ${activeTab === tab.id
                ? 'bg-gradient-to-r from-[#F17922] to-[#FA6345] text-white'
                : 'bg-white border-slate-200 border-1 text-gray-500 hover:bg-gray-200'
              }
            `}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  )
}

export default PromoTabs
