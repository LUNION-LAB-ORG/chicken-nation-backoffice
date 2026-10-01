"use client";

import React from "react";
import { PhoneCall } from "lucide-react";
import { useDashboardStore } from "@/store/dashboardStore";
import { demanderPermissionNotifications } from "../../hooks/useSonRelances";
import { usePeutVoirLesBrouillons, useRelancesQuery } from "../../queries/relance.query";
import { texteInfobulle } from "../../utils/relance";

/**
 * Compteur « À relancer » de l'en-tête de la page Commandes, visible sur
 * tous les onglets. Compact sur une ligne : le libellé ne s'affiche que
 * quand l'en-tête a la place (même requête de conteneur que les autres
 * actions), l'icône et la pastille toujours. Un clic ouvre l'onglet.
 */
export function CompteurRelances() {
  const habilite = usePeutVoirLesBrouillons();
  const { data } = useRelancesQuery();
  const openRelances = useDashboardStore((s) => s.openRelances);
  if (!habilite) return null;

  const n = data?.compteurs?.a_relancer ?? 0;
  const infobulle = texteInfobulle(data?.compteurs);

  return (
    <button
      type="button"
      onClick={() => {
        demanderPermissionNotifications();
        openRelances();
      }}
      title={infobulle}
      aria-label={`À relancer : ${infobulle}`}
      className="inline-flex items-center justify-center gap-2 whitespace-nowrap shrink-0 h-11 sm:h-auto px-3 sm:py-1 rounded-xl border border-gray-300 bg-white text-sm font-light text-[#595959] hover:bg-gray-50 transition-colors cursor-pointer"
    >
      <PhoneCall size={18} className={`shrink-0 ${n > 0 ? "text-[#F17922]" : ""}`} />
      <span className="hidden @6xl:inline">À relancer</span>
      <span
        className={`min-w-[20px] h-5 px-1.5 rounded-full text-[11px] font-bold leading-none inline-flex items-center justify-center ${
          n > 0 ? "bg-[#F17922] text-white" : "bg-gray-200 text-gray-600"
        }`}
      >
        {n > 99 ? "99+" : n}
      </span>
    </button>
  );
}
