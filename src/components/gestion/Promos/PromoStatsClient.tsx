"use client"

import React from 'react'
import PromoStatsServer from './PromoStatsServer'
import { ApiPromotion } from '@/services/promotionService'

interface PromoStatsClientProps {
  className?: string
  promotions?: ApiPromotion[]
  onViewAllPromotions: () => void // Required pour la version interactive
}

/**
 * Version Client Component de PromoStats avec interactions
 * Utilise le Server Component de base et ajoute les interactions
 */
export function PromoStatsClient({ 
  className = '', 
  promotions = [], 
  onViewAllPromotions 
}: PromoStatsClientProps) {
  return (
    <div className="relative">
      <PromoStatsServer 
        className={className} 
        promotions={promotions} 
      />
      
      {/* Overlay interactif pour le bouton "Voir tous" */}
      <div className="absolute bottom-0 right-0 w-full md:w-1/3">
        <div className="flex justify-end">
          <div 
            className="bg-gray-400 hover:bg-[#F17200] cursor-pointer px-6 py-4 transition-colors rounded-b-2xl"
            onClick={onViewAllPromotions}
          >
            <div className="w-full text-white text-sm font-medium text-center">
              Voir tous
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 