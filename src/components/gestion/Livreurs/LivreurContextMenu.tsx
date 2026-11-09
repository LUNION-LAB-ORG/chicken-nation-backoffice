"use client";

import { CheckCircle2, Eye, RefreshCw } from "lucide-react";
import React from "react";

import { useReactivateLivreur } from "../../../../features/livreurs/hook/use-livreurs";
import type { Livreur } from "../../../../features/livreurs/types/livreur.types";

interface LivreurContextMenuProps {
  livreur: Livreur;
  isOpen: boolean;
  onClose: () => void;
  /** Ouvre la page détail (où vivent les actions à motif : refuser / suspendre). */
  onViewDetails: () => void;
  /** Valider avec le restaurant (09/11) : ouvre le choix du restaurant. */
  onValidate: () => void;
}

/**
 * Menu contextuel du 3-points dans la liste livreurs.
 *
 * Actions : Accepter (PENDING **ou REJECTED**), qui ouvre le choix du
 * restaurant (validation avec le restaurant, 09/11), Réactiver (SUSPENDED). Les actions à motif (Refuser / Suspendre) restent dans
 * la page détail. Mirror de OrderContextMenu (même mécanique click-outside).
 */
const LivreurContextMenu: React.FC<LivreurContextMenuProps> = ({
  livreur,
  isOpen,
  onClose,
  onViewDetails,
  onValidate,
}) => {
  const { mutate: reactivate, isPending: isReactivating } = useReactivateLivreur();

  const canAccept =
    livreur.status === "PENDING_VALIDATION" || livreur.status === "REJECTED";
  const canReactivate = livreur.status === "SUSPENDED";

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isOpen &&
        !(event.target as Element).closest(".livreur-context-menu") &&
        !(event.target as Element).closest(".livreur-menu-button")
      ) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="livreur-context-menu w-56 bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200">
      <div className="py-1">
        <button
          type="button"
          className="w-full px-4 py-2 text-left text-sm flex items-center gap-2 text-[#595959] hover:bg-orange-50 cursor-pointer"
          onClick={() => {
            onViewDetails();
            onClose();
          }}
        >
          <Eye size={16} />
          <span>Voir les détails</span>
        </button>

        {canAccept && (
          <button
            type="button"
            className="w-full px-4 py-2 text-left text-sm flex items-center gap-2 text-[#22C55E] font-semibold hover:bg-gray-50 cursor-pointer disabled:opacity-50"
            onClick={() => {
              onValidate();
              onClose();
            }}
          >
            <CheckCircle2 size={16} />
            <span>
              {livreur.status === "REJECTED"
                ? "Accepter (après refus)"
                : "Valider le livreur"}
            </span>
          </button>
        )}

        {canReactivate && (
          <button
            type="button"
            disabled={isReactivating}
            className="w-full px-4 py-2 text-left text-sm flex items-center gap-2 text-[#22C55E] font-semibold hover:bg-gray-50 cursor-pointer disabled:opacity-50"
            onClick={() => {
              reactivate(livreur.id);
              onClose();
            }}
          >
            <RefreshCw size={16} />
            <span>Réactiver</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default LivreurContextMenu;
