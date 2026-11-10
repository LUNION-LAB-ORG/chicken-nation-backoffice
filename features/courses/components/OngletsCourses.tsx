'use client';

import { History, Map as IconeCarte, SquareKanban } from 'lucide-react';
import React from 'react';

import type { OngletCourses } from '@/store/dashboardStore';

/**
 * Les trois vues de l'écran Courses (demande du 10/11) : « En direct » (le
 * kanban, avec le nombre de courses en cours), « Carte » (l'ancienne Carte
 * live, avec ses alertes rouges) et « Historique » (le tableau).
 */
export function OngletsCourses({
  onglet,
  onChange,
  enCours,
  alertes,
}: {
  onglet: OngletCourses;
  onChange: (onglet: OngletCourses) => void;
  /** Courses en cours (kanban, sans les terminées) ; null pendant le chargement. */
  enCours: number | null;
  /** Alertes rouges du restaurant choisi. */
  alertes: number;
}) {
  const onglets: { cle: OngletCourses; libelle: string; Icone: React.FC<{ className?: string }>; nombre: number | null; rouge: boolean }[] = [
    { cle: 'en_direct', libelle: 'En direct', Icone: SquareKanban, nombre: enCours, rouge: false },
    { cle: 'carte', libelle: 'Carte', Icone: IconeCarte, nombre: alertes > 0 ? alertes : null, rouge: true },
    { cle: 'historique', libelle: 'Historique', Icone: History, nombre: null, rouge: false },
  ];
  return (
    <div role="tablist" aria-label="Vues des courses" className="flex w-full gap-1 rounded-xl bg-[#F4F4F5] p-1 sm:w-fit">
      {onglets.map(({ cle, libelle, Icone, nombre, rouge }) => {
        const choisi = cle === onglet;
        return (
          <button
            key={cle}
            type="button"
            role="tab"
            aria-selected={choisi}
            onClick={() => onChange(cle)}
            className={`inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg px-3 text-sm font-semibold transition-colors sm:flex-none sm:px-4 ${
              choisi ? 'bg-white text-[#18181B] shadow-sm' : 'text-[#71717A] hover:text-[#18181B]'
            }`}
          >
            <Icone className={`h-4 w-4 ${choisi ? 'text-[#F17922]' : ''}`} />
            {libelle}
            {nombre !== null && (
              <span
                className={`min-w-[20px] rounded-full px-1.5 py-0.5 text-[11px] leading-none ${
                  rouge ? 'bg-red-100 text-red-700' : choisi ? 'bg-orange-50 text-[#F17922]' : 'bg-white text-[#52525B]'
                }`}
              >
                {nombre}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export default OngletsCourses;
