"use client";

import React from "react";
import type { LucideIcon } from "lucide-react";

interface EnTeteSectionProps {
  Icone: LucideIcon;
  titre: string;
  sousTitre?: string;
  /** Pastille ou rappel à droite du titre (« Client existant »). */
  droite?: React.ReactNode;
}

/**
 * En-tête commun des sections de la prise de commande : pastille orange,
 * titre en gras, trait dessous. Les sections se repèrent d'un coup d'œil,
 * toutes de la même façon.
 */
const EnTeteSection: React.FC<EnTeteSectionProps> = ({ Icone, titre, sousTitre, droite }) => (
  <div className="flex items-center justify-between gap-3 border-b border-gray-100 pb-3.5">
    <div className="flex min-w-0 items-center gap-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F17922] text-white">
        <Icone className="h-[18px] w-[18px]" />
      </span>
      <div className="min-w-0">
        <h3 className="text-base font-bold leading-tight text-gray-900">{titre}</h3>
        {sousTitre && <p className="mt-0.5 text-xs text-gray-500">{sousTitre}</p>}
      </div>
    </div>
    {droite}
  </div>
);

export default EnTeteSection;
