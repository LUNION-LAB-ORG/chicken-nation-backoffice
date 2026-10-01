"use client";

import React from "react";
import { Volume2, VolumeX } from "lucide-react";
import { demanderPermissionNotifications } from "../../hooks/useSonRelances";
import { useRelanceSonStore } from "../../stores/relance-son.store";

interface Props {
  /** Icône seule (bandeau) ; le libellé reste en infobulle. */
  compact?: boolean;
  className?: string;
}

/**
 * Couper ou rétablir le son des relances, pour ce navigateur seulement. Le
 * bandeau et les pastilles restent affichés son coupé. Le clic est aussi le
 * geste qui permet de demander l'autorisation des notifications du système.
 */
export function InterrupteurSonRelances({ compact = false, className = "" }: Props) {
  const sonCoupe = useRelanceSonStore((s) => s.sonCoupe);
  const basculerSon = useRelanceSonStore((s) => s.basculerSon);
  const libelle = sonCoupe ? "Rétablir le son des relances" : "Couper le son des relances";
  const Icone = sonCoupe ? VolumeX : Volume2;

  return (
    <button
      type="button"
      onClick={() => {
        demanderPermissionNotifications();
        basculerSon();
      }}
      title={libelle}
      aria-label={libelle}
      aria-pressed={sonCoupe}
      className={`inline-flex items-center gap-1.5 rounded-xl border text-[13px] font-medium transition-colors cursor-pointer shrink-0 ${
        compact ? "h-9 w-9 justify-center" : "h-9 px-3"
      } ${
        sonCoupe
          ? "border-gray-300 bg-gray-100 text-gray-600 hover:bg-gray-200"
          : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
      } ${className}`}
    >
      <Icone className="w-4 h-4 shrink-0" />
      {!compact && <span className="whitespace-nowrap">{libelle}</span>}
    </button>
  );
}
