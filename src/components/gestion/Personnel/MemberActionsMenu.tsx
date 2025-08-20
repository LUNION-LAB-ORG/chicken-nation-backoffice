"use client"

import React from "react"
import { useRBAC } from '@/hooks/useRBAC'

interface MemberActionsMenuProps {
 memberStatus?: 'active' | 'blocked' | 'deleted'
 onBlock?: () => void
 onUnblock?: () => void
 onReactivate?: () => void
 onViewProfile?: () => void
 onClose: () => void
}

export default function MemberActionsMenu({
 memberStatus = 'active',
 onBlock,
 onUnblock,
 onReactivate,
 onViewProfile
}: MemberActionsMenuProps) {
  const { canUpdateUtilisateur, canDeleteUtilisateur } = useRBAC()

  const renderActions = () => {
    switch (memberStatus) {
      case 'active':
        return (
          <>
            {canUpdateUtilisateur && onViewProfile && (
              <button
                type="button"
                className="block w-full text-[#232323] text-[14px] cursor-pointer text-left font-normal px-4 py-2.5 hover:bg-[#F5F5F5] outline-none"
                onClick={onViewProfile}
              >
                Voir le profil
              </button>
            )}
            {canDeleteUtilisateur && onBlock && (
              <button
                type="button"
                className="block w-full text-[#f12222] text-[14px] cursor-pointer text-left font-normal px-4 py-2.5 hover:bg-[#FFF6E9] rounded-b-xl outline-none"
                onClick={onBlock}
              >
                  Supprimer l&apos;utilisateur
              </button>
            )}
          </>
        );

      case 'blocked':
        return (
          <>
            {canUpdateUtilisateur && onViewProfile && (
              <button
                type="button"
                className="block w-full text-[#232323] text-[14px] cursor-pointer text-left font-normal px-4 py-2.5 hover:bg-[#F5F5F5] outline-none"
                onClick={onViewProfile}
              >
                Voir le profil
              </button>
            )}
            {canUpdateUtilisateur && onUnblock && (
              <button
                type="button"
                className="block w-full text-[#34C759] text-[14px] cursor-pointer text-left font-normal px-4 py-2.5 hover:bg-[#E5F9EB] rounded-b-xl outline-none"
                onClick={onUnblock}
              >
                 Restorer l&apos;utilisateur
              </button>
            )}
          </>
        );

      case 'deleted':
        return (
          <>
            {canUpdateUtilisateur && onViewProfile && (
              <button
                type="button"
                className="block w-full text-[#232323] text-[14px] cursor-pointer text-left font-normal px-4 py-2.5 hover:bg-[#F5F5F5] outline-none"
                onClick={onViewProfile}
              >
                Voir le profil
              </button>
            )}
            {canUpdateUtilisateur && onReactivate && (
              <button
                type="button"
                className="block w-full text-[#34C759] text-[14px] cursor-pointer text-left font-semibold px-4 py-2.5 hover:bg-[#E5F9EB] rounded-b-xl outline-none"
                onClick={onReactivate}
              >
                Réactiver l&apos;utilisateur
              </button>
            )}
          </>
        );

      default:
        return null;
    }
  };

  return (
    <div
      className="bg-white rounded-xl shadow-lg px-0 py-0 min-w-[200px] border border-[#ECECEC] select-none z-[120]"
      style={{ boxShadow: '0 4px 28px 0 rgba(44, 44, 44, 0.10)' }}
      onClick={e => e.stopPropagation()}
    >
      {renderActions()}
    </div>
  )
}
