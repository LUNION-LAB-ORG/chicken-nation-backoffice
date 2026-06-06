"use client";

import React, { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  /** Largeur max sur desktop (md+). Défaut `md:max-w-lg`. */
  className?: string;
  /** Affiche la poignée de préhension sur mobile (défaut true). */
  showHandle?: boolean;
  /** Classe de z-index (défaut z-[60]). */
  zClassName?: string;
}

/**
 * Conteneur responsive :
 *  - **mobile (< md)** : bottom-sheet qui glisse depuis le bas, coins arrondis en
 *    haut, poignée, `pb-safe` (dégage la barre d'accueil iOS) ;
 *  - **desktop (md+)** : dialog centré classique.
 *
 * Le `children` fournit son propre en-tête/contenu. Réutilisé par le modal de
 * capture et (en Phase 2) par le `Modal` partagé.
 */
export default function BottomSheet({
  isOpen,
  onClose,
  children,
  className = "md:max-w-lg",
  showHandle = true,
  zClassName = "z-[60]",
}: BottomSheetProps) {
  // Verrouille le scroll de la page quand le sheet est ouvert
  useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "unset";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="bottom-sheet"
          className={`fixed inset-0 ${zClassName} flex items-end justify-center md:items-center md:p-4`}
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 1 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Panneau */}
          <motion.div
            className={`relative w-full ${className} bg-white shadow-2xl
              rounded-t-3xl md:rounded-2xl max-h-[92vh] md:max-h-[88vh]
              flex flex-col overflow-hidden`}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "tween", duration: 0.28, ease: [0.32, 0.72, 0, 1] }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            {showHandle && (
              <div className="md:hidden flex justify-center pt-2.5 pb-1 shrink-0">
                <span className="h-1 w-9 rounded-full bg-gray-300" />
              </div>
            )}
            <div className="flex-1 overflow-y-auto overscroll-contain pb-safe">
              {children}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
