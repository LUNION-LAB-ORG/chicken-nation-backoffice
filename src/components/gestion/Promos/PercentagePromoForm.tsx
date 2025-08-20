"use client"

import React from 'react'

interface PercentagePromoFormProps {
  percentageValue: string
  onPercentageChange: (value: string) => void
  discountCeiling: string
  onDiscountCeilingChange: (value: string) => void
}

const PercentagePromoForm = ({
  percentageValue,
  onPercentageChange,
  discountCeiling,
  onDiscountCeilingChange
}: PercentagePromoFormProps) => {
  return (
    <div className="xl:space-y-30 space-y-6">
      <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0'>
        <label className="block text-[#F17922] font-medium mb-2">Pourcentage de réduction</label>
        <input
          type="text"
          placeholder="Ex: 10, 20, 30"
          value={percentageValue}
          onChange={(e) => onPercentageChange(e.target.value)}
          className="w-full sm:w-70 px-4 py-3 border border-gray-300 rounded-xl text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
        />
      </div>
      <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0'>
        <label className="block text-[#F17922] font-medium mb-2">Plafond de réduction (optionnel)</label>
        <input
          type="text"
          placeholder="Ex: 5 000 FCFA"
          value={discountCeiling}
          onChange={(e) => onDiscountCeilingChange(e.target.value)}
          className="w-full sm:w-70 px-4 py-3 border border-gray-300 rounded-xl text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
        />
      </div>
    </div>
  )
}

export default PercentagePromoForm
