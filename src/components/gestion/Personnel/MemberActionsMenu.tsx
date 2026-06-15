"use client";

import React from "react";
import { HasPermission } from "../../../../features/users/components/HasPermission";
import { Action, Modules } from "../../../../features/users/types/auth.type";

interface MemberActionsMenuProps {
  memberStatus?: "active" | "blocked" | "deleted";
  onViewProfile?: () => void;
  onEdit?: () => void;
  /** Suspendre (réversible) */
  onSuspend?: () => void;
  /** Restaurer un membre suspendu */
  onRestore?: () => void;
  /** Supprimer définitivement (irréversible) */
  onDelete?: () => void;
  onClose: () => void;
}

const itemBase =
  "block w-full text-[14px] cursor-pointer text-left font-normal px-4 py-2.5 outline-none";

export default function MemberActionsMenu({
  memberStatus = "active",
  onViewProfile,
  onEdit,
  onSuspend,
  onRestore,
  onDelete,
}: MemberActionsMenuProps) {
  const isSuspended = memberStatus === "blocked" || memberStatus === "deleted";

  return (
    <div
      className="bg-white rounded-xl shadow-lg px-0 py-0 min-w-[210px] border border-[#ECECEC] select-none z-[120]"
      style={{ boxShadow: "0 4px 28px 0 rgba(44, 44, 44, 0.10)" }}
      onClick={(e) => e.stopPropagation()}
    >
      {onViewProfile && (
        <HasPermission module={Modules.PERSONNELS} action={Action.READ}>
          <button
            type="button"
            className={`${itemBase} text-[#232323] hover:bg-[#F5F5F5]`}
            onClick={onViewProfile}
          >
            Voir le profil
          </button>
        </HasPermission>
      )}

      {onEdit && (
        <HasPermission module={Modules.PERSONNELS} action={Action.UPDATE}>
          <button
            type="button"
            className={`${itemBase} text-[#232323] hover:bg-[#F5F5F5]`}
            onClick={onEdit}
          >
            Modifier
          </button>
        </HasPermission>
      )}

      {/* Suspendre (membre actif) OU Restaurer (membre suspendu) */}
      {isSuspended
        ? onRestore && (
            <HasPermission module={Modules.PERSONNELS} action={Action.UPDATE}>
              <button
                type="button"
                className={`${itemBase} text-[#34C759] hover:bg-[#E5F9EB]`}
                onClick={onRestore}
              >
                Restaurer l&apos;utilisateur
              </button>
            </HasPermission>
          )
        : onSuspend && (
            <HasPermission module={Modules.PERSONNELS} action={Action.DELETE}>
              <button
                type="button"
                className={`${itemBase} text-[#F17922] hover:bg-[#FFF6E9]`}
                onClick={onSuspend}
              >
                Suspendre l&apos;utilisateur
              </button>
            </HasPermission>
          )}

      {/* Suppression définitive — toujours disponible, en bas, en rouge */}
      {onDelete && (
        <HasPermission module={Modules.PERSONNELS} action={Action.DELETE}>
          <button
            type="button"
            className={`${itemBase} text-[#f12222] hover:bg-red-50 rounded-b-xl border-t border-[#F5F5F5]`}
            onClick={onDelete}
          >
            Supprimer définitivement
          </button>
        </HasPermission>
      )}
    </div>
  );
}
