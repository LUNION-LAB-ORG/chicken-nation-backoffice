"use client";

import Image from "next/image";
import React, { useState } from "react";
import { Expand } from "lucide-react";

import ImageLightbox from "./ImageLightbox";

interface ZoomableImageProps {
  src: string | null;
  alt: string;
  fallback?: React.ReactNode;
  className?: string;
  /** Taille du conteneur (style inline pour height) */
  height?: number;
}

/**
 * Image cliquable qui s'agrandit en lightbox plein écran au click.
 * Affiche un fallback quand src est null (doc manquant, avatar vide…).
 * Icône Expand en overlay au hover pour signaler l'interactivité.
 */
const ZoomableImage: React.FC<ZoomableImageProps> = ({
  src,
  alt,
  fallback,
  className = "",
  height = 200,
}) => {
  const [open, setOpen] = useState(false);

  if (!src) {
    return (
      <div
        className={`rounded-xl bg-[#FAFAFA] border border-[#E4E4E7] flex items-center justify-center ${className}`}
        style={{ height }}
      >
        {fallback}
      </div>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`group relative rounded-xl overflow-hidden border border-[#E4E4E7] bg-[#FAFAFA] w-full cursor-zoom-in focus:outline-none focus:ring-2 focus:ring-[#F17922] ${className}`}
        style={{ height }}
        aria-label={`Agrandir : ${alt}`}
      >
        <Image src={src} alt={alt} fill className="object-cover transition-transform group-hover:scale-105" />
        {/* Overlay hover avec icône */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 rounded-full p-2.5">
            <Expand className="w-5 h-5 text-[#18181B]" />
          </div>
        </div>
      </button>

      <ImageLightbox isOpen={open} onClose={() => setOpen(false)} src={src} alt={alt} />
    </>
  );
};

export default ZoomableImage;
