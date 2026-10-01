"use client";

import React from "react";
import { PhoneCall, Volume2 } from "lucide-react";
import { useDashboardStore } from "@/store/dashboardStore";
import { useHorlogeRelances } from "../../hooks/useHorlogeRelances";
import { activerSonRelances, demanderPermissionNotifications } from "../../hooks/useSonRelances";
import { usePeutVoirLesBrouillons, useRelancesQuery } from "../../queries/relance.query";
import { useRelanceUiStore } from "../../stores/relance-ui.store";
import { GroupeRelance } from "../../types/relance.types";
import { texteBandeau } from "../../utils/relance";
import { InterrupteurSonRelances } from "./InterrupteurSonRelances";

/**
 * Bandeau global « N commandes à relancer », sur toutes les pages de
 * `/gestion` pour l'ADMIN et le centre d'appels.
 *
 * Absent quand rien n'est à relancer ou quand l'onglet « À relancer » est
 * déjà à l'écran. Rendu DANS le flux, en tête du contenu (src/app/gestion/
 * page.tsx) et collé sous l'en-tête au défilement : sa hauteur est réservée,
 * il ne recouvre ni l'en-tête des pages ni la fin du contenu. Toujours sous
 * le tiroir de commande (z-50) et le panneau d'appel (z-190). La marge du
 * bas absorbe le `sm:-mt-6` de DashboardPageHeader.
 *
 * Le parent ne lit que des stores : l'horloge (une minuterie de 10 s) ne
 * tourne que quand le bandeau s'affiche, jamais pour un rôle non habilité.
 */
export default function BandeauRelances() {
  const habilite = usePeutVoirLesBrouillons();
  const { data } = useRelancesQuery();
  const ongletVisible = useRelanceUiStore((s) => s.ongletVisible);

  const aRelancer = data?.compteurs?.a_relancer ?? 0;
  if (!habilite || !data || aRelancer === 0 || ongletVisible) return null;
  return <ContenuBandeau groupes={data.groupes} />;
}

function ContenuBandeau({ groupes }: { groupes: GroupeRelance[] }) {
  const sonBloque = useRelanceUiStore((s) => s.sonBloque);
  const openRelances = useDashboardStore((s) => s.openRelances);
  const maintenant = useHorlogeRelances();

  const texte = texteBandeau(groupes, maintenant);
  if (!texte) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="sticky z-20 top-[calc(3.5rem+env(safe-area-inset-top))] md:top-14 bg-gray-50 px-3 py-2 sm:mb-2 md:p-0"
    >
      <div className="flex flex-wrap md:flex-nowrap items-center gap-2 rounded-2xl md:rounded-none border border-orange-200 md:border-x-0 md:border-t-0 bg-orange-50 px-3 py-2 shadow-sm">
        <PhoneCall className="w-4 h-4 shrink-0 text-[#F17922]" />
        <p className="flex-1 min-w-0 text-[13px] font-medium text-gray-800 md:truncate">{texte}</p>
        <div className="flex items-center gap-2 ml-auto">
          {sonBloque && (
            <button
              type="button"
              onClick={() => void activerSonRelances()}
              className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl border border-[#F17922] bg-white text-[13px] font-semibold text-[#F17922] hover:bg-orange-100 cursor-pointer whitespace-nowrap"
            >
              <Volume2 className="w-4 h-4" />
              Activer le son
            </button>
          )}
          <InterrupteurSonRelances compact />
          <button
            type="button"
            onClick={() => {
              demanderPermissionNotifications();
              openRelances();
            }}
            className="h-9 px-4 rounded-xl bg-[#F17922] text-white text-[13px] font-semibold hover:bg-[#e06816] cursor-pointer whitespace-nowrap"
          >
            Voir
          </button>
        </div>
      </div>
    </div>
  );
}
