"use client"

import React from 'react'

type PromoType = 'percentage' | 'fixed' | 'buyXgetY'

interface PromoTypeButtonsProps {
  activePromoType: PromoType
  onPromoTypeChange: (type: PromoType) => void
}

const PromoTypeButtons = ({ activePromoType, onPromoTypeChange }: PromoTypeButtonsProps) => {
  const promoTypes = [
    {
      type: 'percentage' as PromoType,
      label: 'Pourcentage',
      example: 'Ex: 10% de réduction'
    },
    {
      type: 'fixed' as PromoType,
      label: 'Montant fixe',
      example: 'Ex: 1000 XOF de réduction'
    },
    {
      type: 'buyXgetY' as PromoType,
      label: 'Achetez X, Obtenez Y',
      example: 'Ex: Achetez 2, obtenez 1'
    }
  ]

  return (
    <div className="flex-1">
      <h3 className="text-[#F17922] font-medium mb-4">Type de promotion</h3>
      <div className="space-y-3">
        {promoTypes.map((promo) => (
          <button
            key={promo.type}
            type="button"
            onClick={() => onPromoTypeChange(promo.type)}
            className={`w-full p-4 rounded-2xl flex cursor-pointer justify-between items-center transition-colors ${
              activePromoType === promo.type
                ? 'bg-[#FDE9DA] border-2 border-[#F17922]'
                : 'bg-white border border-gray-200 hover:bg-gray-50'
            }`}
          >
            <span className={`font-medium ${
              activePromoType === promo.type ? 'text-slate-800 font-semibold' : "text-gray-400"
              }`}>{promo.label}</span>
            <span className={`text-sm ${
              activePromoType === promo.type ? "text-slate-600 font-medium" : "text-gray-400"
              }`}>{promo.example}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

export default PromoTypeButtons
