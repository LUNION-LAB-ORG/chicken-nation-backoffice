"use client"

import React from "react"
import { useRBAC } from '@/hooks/useRBAC'

interface SupplementActionsMenuProps {
  menuPosition: { top: number, left: number } | null
  menuRef: React.RefObject<HTMLDivElement | null>
  productId: string
  onEdit?: () => void
  onDelete?: () => void
}

export default function SupplementActionsMenu({
  menuPosition,
  menuRef,
  onEdit,
  onDelete
}: SupplementActionsMenuProps) {
  const { canUpdateSupplement, canDeleteSupplement } = useRBAC()

  if (!menuPosition) return null;


  return (
    <div
      ref={menuRef}
      className="fixed bg-white rounded-xl shadow-lg px-0 py-0 min-w-[200px] border border-[#ECECEC] select-none z-[120]"
      style={{
        top: `${menuPosition.top}px`,
        left: `${menuPosition.left}px`,
        boxShadow: '0 4px 28px 0 rgba(44, 44, 44, 0.10)'
      }}
      onClick={e => e.stopPropagation()}
    >
      {canUpdateSupplement && onEdit && (
        <button
          type="button"
          className="block w-full text-[#484848] text-[14px] cursor-pointer text-left font-normal px-4 py-2.5 hover:bg-[#F7F7F7] rounded-t-xl outline-none"
          onClick={onEdit}
        >
          Modifier le supplément
        </button>
      )}
      {canDeleteSupplement && onDelete && (
        <button
          type="button"
          className="block w-full text-[#F04438] text-[14px] cursor-pointer text-left font-semibold px-4 py-2.5 hover:bg-[#FFF3F2] rounded-b-xl outline-none"
          onClick={onDelete}
        >
          Supprimer le supplément
        </button>
      )}
    </div>
  )
}
