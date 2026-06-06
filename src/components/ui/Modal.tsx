"use client";

import React from "react";
import Image from "next/image";
import BottomSheet from "./BottomSheet";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: "default" | "large" | "full";
}

/**
 * Modal partagé. Sur mobile (< md) → bottom-sheet glissant (via `BottomSheet`) ;
 * sur desktop (md+) → dialog centré classique. En-tête orange « sticky » qui
 * reste visible pendant le scroll du contenu.
 */
export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = "default",
}: ModalProps) {
  const widthCls =
    size === "large"
      ? "md:max-w-5xl"
      : size === "full"
        ? "md:max-w-[95%]"
        : "md:max-w-3xl";

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} className={widthCls}>
      <div className="sticky top-0 z-10 flex items-center px-6 py-2.5 bg-[#FDEDD3]">
        <div className="flex-1 text-center">
          <h3 className="text-[#F17922] font-medium">{title}</h3>
        </div>
        <button
          onClick={onClose}
          className="rounded-full p-1 cursor-pointer hover:bg-black/5 transition-colors absolute right-4"
          aria-label="Fermer"
        >
          <Image
            src="/icons/close.png"
            alt="Fermer"
            width={20}
            height={20}
            className="opacity-80"
          />
        </button>
      </div>

      <div className="p-6">{children}</div>
    </BottomSheet>
  );
}
