"use client"

import React from 'react'
import Button from '@/components/ui/Button'
import { useRBAC } from '@/hooks/useRBAC'

interface InventoryHeaderProps {
  onCreateCategory: () => void
}

export default function InventoryHeader({ onCreateCategory }: InventoryHeaderProps) {
  const { canCreateCategory } = useRBAC()

  // ✅ RBAC: Vérifier les permissions pour créer une catégorie
  const canAddCategory = canCreateCategory()

  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-4">
        <div className="bg-white rounded-[10px] shadow-sm">
          <button type="button" className="text-[#F17922] text-[13px] font-medium px-4 py-2 hover:bg-orange-50">
            Produits
          </button>
          <button type="button" className="text-[#9796A1] text-[13px] font-medium px-4 py-2 hover:bg-gray-50">
            Catégories
          </button>
        </div>
        <button type="button" className="text-[#F17922] text-[13px] font-medium">
          Tous les produits
        </button>
      </div>

      {canAddCategory && (
        <div className="flex items-center gap-2">
          <Button
            onClick={onCreateCategory}
            className="h-[32px] text-[#9796A1] px-12 rounded-[10px] bg-[#ECECEC] text-[13px] items-center justify-center hover:bg-gray-100"
          >
            Créer une catégorie
          </Button>
        </div>
      )}
    </div>
  )
}
