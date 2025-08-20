"use client"

import React from 'react'
import PromoCardServer, { PromoCardData } from './PromoCardServer'

interface PromoCardClientProps {
  promo: PromoCardData
  className?: string
  onClick: (promo: PromoCardData) => void // Required pour la version interactive
}

/**
 * Version Client Component de PromoCard avec interactions
 * Utilise le Server Component de base et ajoute les interactions
 */
export function PromoCardClient({ promo, onClick, className = '' }: PromoCardClientProps) {
  return (
    <div 
      onClick={() => onClick(promo)}
      className="cursor-pointer hover:scale-105 hover:shadow-lg transition-transform duration-300"
    >
      <PromoCardServer promo={promo} className={className} />
    </div>
  )
} 