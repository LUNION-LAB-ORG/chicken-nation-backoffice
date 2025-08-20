"use client"

import React from 'react'
import { Loader2 } from 'lucide-react'
import Button from '@/components/ui/Button'
import { Category } from '@/services'

interface DeleteCategoryModalProps {
  category: Category
  onClose: () => void
  onConfirm: (category: Category) => void
  isLoading?: boolean
}

export default function DeleteCategoryModal({ 
  category, 
  onClose, 
  onConfirm,
  isLoading = false
}: DeleteCategoryModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-6 max-w-md w-full">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Supprimer la catégorie</h3>
        
        <p className="text-[14px] text-gray-600 mb-6">
          Êtes-vous sûr de vouloir supprimer la catégorie <span className="font-semibold">{category.name}</span> ? 
          Cette action est irréversible et supprimera définitivement cette catégorie.
        </p>
        
        <div className="flex flex-col sm:flex-row justify-end gap-3">
          <Button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="h-[38px] text-[#9796A1] px-6 rounded-[10px] bg-[#ECECEC] text-[13px] 
            items-center justify-center hover:bg-gray-100 order-2 sm:order-1"
          >
            Annuler
          </Button>
          <Button 
            type="button"
            onClick={() => onConfirm(category)}
            disabled={isLoading}
            className="h-[38px] px-6 rounded-[10px] bg-red-600 hover:bg-red-700 text-white text-[13px] 
            flex items-center justify-center order-1 sm:order-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Suppression...
              </>
            ) : (
              'Supprimer'
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
