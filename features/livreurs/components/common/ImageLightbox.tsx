"use client";

import Image from "next/image";
import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { X, ZoomIn } from "lucide-react";

interface ImageLightboxProps {
  isOpen: boolean;
  onClose: () => void;
  src: string;
  alt?: string;
}

/**
 * Viewer plein écran pour afficher une image en grand (pièce d'identité, permis, avatar).
 *
 * - Portal pour sortir du flux normal
 * - Click sur overlay ou Escape → ferme
 * - Image contenue dans le viewport avec object-contain (jamais croppée)
 * - Hint visuel en haut à droite pour signaler la fermeture
 */
const ImageLightbox: React.FC<ImageLightboxProps> = ({ isOpen, onClose, src, alt = "Image" }) => {
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    // Empêche le scroll body pendant que le viewer est ouvert
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  if (!isOpen || typeof window === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-6 animate-in fade-in"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute top-5 right-5 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
        aria-label="Fermer"
      >
        <X className="w-5 h-5" />
      </button>

      <p className="absolute top-5 left-5 text-white/70 text-sm font-medium flex items-center gap-1.5">
        <ZoomIn className="w-4 h-4" />
        Cliquez pour fermer · Échap
      </p>

      <div
        className="relative max-w-[95vw] max-h-[90vh] flex items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        <Image
          src={src}
          alt={alt}
          width={1600}
          height={1600}
          className="object-contain rounded-lg"
          style={{ maxWidth: "95vw", maxHeight: "90vh", width: "auto", height: "auto" }}
          priority
        />
      </div>
    </div>,
    document.body,
  );
};

export default ImageLightbox;
