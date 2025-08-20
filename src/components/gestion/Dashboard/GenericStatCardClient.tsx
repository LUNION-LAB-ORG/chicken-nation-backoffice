"use client"

import React from 'react'
import { GenericStatCardServer } from './GenericStatCardServer'
import { LucideIcon } from "lucide-react"

interface GenericStatCardClientProps {
  title: string
  value: string | number
  unit?: string
  badgeColor?: string
  badgeText?: string
  icon?: LucideIcon
  iconColor?: string
  iconImage?: string
  trend?: {
    value: number
    isPositive: boolean
  }
  objective?: {
    value: string
    percentage: number
  }
  className?: string
  onClick: () => void // Required pour la version interactive
}

/**
 * Version Client Component de GenericStatCard avec interactions
 * Utilise le Server Component de base et ajoute les interactions
 */
export function GenericStatCardClient({ onClick, ...props }: GenericStatCardClientProps) {
  return (
    <div 
      onClick={onClick}
      className="cursor-pointer hover:shadow-lg hover:scale-[1.02] transition-all duration-200"
    >
      <GenericStatCardServer {...props} />
    </div>
  )
} 