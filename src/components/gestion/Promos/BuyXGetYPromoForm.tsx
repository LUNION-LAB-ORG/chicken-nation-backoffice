"use client"

import React from 'react'

interface BuyXGetYPromoFormProps {
  buyQuantity: string
  onBuyQuantityChange: (value: string) => void
  getQuantity: string
  onGetQuantityChange: (value: string) => void
  discountCeiling: string
  onDiscountCeilingChange: (value: string) => void
}

const BuyXGetYPromoForm = ({
  buyQuantity,
  onBuyQuantityChange,
  getQuantity,
  onGetQuantityChange,
  discountCeiling,
  onDiscountCeilingChange
}: BuyXGetYPromoFormProps) => {
  return (
    <div className="xl:space-y-10 space-y-6">
      <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0'>
        <label className="block text-[#F17922] font-medium mb-2">Acheter (Quantité)</label>
        <input
          type="number"
          placeholder="Ex: 2"
          value={buyQuantity}
          onChange={(e) => onBuyQuantityChange(e.target.value)}
          className="w-full sm:w-70 px-4 py-3 border border-gray-300 rounded-xl text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#F17922]"
        />
      </div>
      <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0'>
        <label className="block text-[#F17922] font-medium mb-2">Obtenez (Quantité)</label>
        <input
          type="number"
          placeholder="Ex: 1"
          value={getQuantity}
          onChange={(e) => onGetQuantityChange(e.target.value)}
          className="w-full sm:w-70 px-4 py-3 border border-gray-300 rounded-xl text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#F17922]"
        />
      </div>
      <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0'>
        <label className="block text-[#F17922] font-medium mb-2">Plafond de réduction (optionnel)</label>
        <input
          type="number"
          placeholder="Ex: 5 000 FCFA"
          value={discountCeiling}
          onChange={(e) => onDiscountCeilingChange(e.target.value)}
          className="w-full sm:w-70 px-4 py-3 border border-gray-300 rounded-xl text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#F17922]"
        />
      </div>
    </div>
  )
}

export default BuyXGetYPromoForm
