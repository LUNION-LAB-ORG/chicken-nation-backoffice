"use client"

import React from 'react'
import { PromoCardData } from './PromoCard'
import PromoDesignGridCard from './PromoDesignGridCard'

interface PromoGridProps {
  promos: PromoCardData[]
  onPromoClick?: (promo: PromoCardData) => void
  loading?: boolean
  className?: string
}

const PromoGrid = ({ promos, onPromoClick, loading = false, className = '' }: PromoGridProps) => {

  // Affichage du state de chargement
  if (loading) {
    return (
      <div className={`${className}`}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 lg:gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="h-48 sm:h-52 md:h-56 lg:h-60 xl:h-64 2xl:h-72 bg-gray-200 rounded-xl animate-pulse"
            />
          ))}
        </div>
      </div>
    )
  }

  // Affichage si aucune promotion
  if (promos.length === 0) {
    return (
      <div className={`${className} flex flex-col items-center justify-center py-12`}>
        <div className="text-gray-400 text-lg mb-2">Aucune promotion disponible</div>
        <div className="text-gray-500 text-sm">Créez votre première promotion pour commencer</div>
      </div>
    )
  }

  return (
    <div className={`${className}`}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {promos.map((promo) => (
          <PromoDesignGridCard
            key={promo.id}
            promo={promo} 
            onClick={() => onPromoClick?.(promo)}
            className="h-48 sm:h-52 md:h-56 lg:h-60 xl:h-64 2xl:h-72 cursor-pointer"
          />
        ))}
      </div>
    </div>
  )
}

export default PromoGrid
