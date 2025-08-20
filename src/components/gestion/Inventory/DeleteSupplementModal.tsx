"use client"

import React from 'react'
import Button from '@/components/ui/Button'

interface Product {
  id: string;
  name: string;
}

interface DeleteSupplementModalProps {
  onCancel: () => void
  onDelete: (productId: string) => void
  product: Product
}

export default function DeleteSupplementModal({ 
  onCancel, 
  onDelete, 
  product 
}: DeleteSupplementModalProps) {
  if (!product) return null;

  const handleConfirm = () => {
    onDelete(product.id);
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4">Confirmer la suppression</h2>
      <p className="mb-6">
        Êtes-vous sûr de vouloir supprimer le supplément {product.name} ? 
        Cette action est irréversible.
      </p>
      <div className="flex justify-end space-x-3">
        <Button
          onClick={onCancel}
          className="h-[40px] text-[#9796A1] px-6 rounded-[10px] bg-[#ECECEC] text-[13px] items-center justify-center hover:bg-gray-200"
        >
          Annuler
        </Button>
        <Button
          onClick={handleConfirm}
          className="h-[40px] px-6 rounded-[10px] bg-[#F04438] hover:bg-[#F04438]/90 text-white text-[13px]"
        >
          Supprimer
        </Button>
      </div>
    </div>
  )
}
