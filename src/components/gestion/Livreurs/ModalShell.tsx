"use client";

import React from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

interface ModalShellProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  maxWidth?: string;
}

/**
 * Shell réutilisable pour tous les modals du module Livreurs.
 * - Portal (react-dom) pour sortir du flux normal
 * - Overlay sombre + click-outside pour fermer
 * - Header avec icône + titre + X
 * - Layout uniforme (padding, border-radius, shadow)
 */
const ModalShell: React.FC<ModalShellProps> = ({
  isOpen,
  onClose,
  title,
  icon,
  children,
  maxWidth = "max-w-md",
}) => {
  if (!isOpen || typeof window === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in"
      onClick={onClose}
    >
      <div
        className={`w-full ${maxWidth} bg-white rounded-2xl shadow-2xl animate-in zoom-in-95`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between p-5 border-b border-[#F4F4F5]">
          <div className="flex items-center gap-3">
            {icon}
            <h2 className="text-lg font-semibold text-[#18181B]">{title}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-[#F4F4F5] text-[#71717A] transition-colors"
            aria-label="Fermer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>,
    document.body,
  );
};

export default ModalShell;
