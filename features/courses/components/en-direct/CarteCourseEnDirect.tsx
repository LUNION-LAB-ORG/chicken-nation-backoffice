'use client';

import { AlertTriangle, Send } from 'lucide-react';
import React from 'react';

import { useDashboardStore } from '@/store/dashboardStore';

// ⚠️ Import RELATIF entre features : `@/` pointe sur src/, `features/` est à la racine.
import { nomCourtRestaurant } from '../../../restaurants/utils/nom-court';
import type { CourseEnDirect } from '../../types/en-direct.types';
import type { TonCarte } from '../../utils/en-direct';
import { nomDuLivreur, tempsDeLaCarte, texteCommandes } from '../../utils/en-direct';
import { ChoixLivreurCourse } from './ChoixLivreurCourse';

const BORDURE: Record<TonCarte | 'aucun', string> = {
  rouge: 'border-l-red-500',
  ambre: 'border-l-amber-400',
  aucun: 'border-l-transparent',
};

const TEXTE_ALERTE: Record<TonCarte, string> = {
  rouge: 'text-red-700 bg-red-50',
  ambre: 'text-amber-800 bg-amber-50',
};

/**
 * Une carte du kanban « En direct » (demande du 10/11) :
 *  - en haut : le code de retrait (ce que le livreur dit au comptoir), le
 *    restaurant (sur « Tous ») ou la référence, et le temps passé dans
 *    l'étape (heure de fin pour une terminée) ;
 *  - l'alerte du tableau de la livraison, s'il y en a une, bord gauche de sa
 *    couleur ;
 *  - Turbo, ou à qui l'offre est proposée ;
 *  - le livreur, à changer d'un menu avant le départ.
 *
 * Toucher la carte ouvre la fiche de la course.
 */
export function CarteCourseEnDirect({
  course,
  alerte,
  maintenant,
  avecRestaurant,
}: {
  course: CourseEnDirect;
  alerte: { ton: TonCarte; texte: string } | null;
  maintenant: Date;
  avecRestaurant: boolean;
}) {
  const openCourse = useDashboardStore((s) => s.openCourse);
  const terminee = course.colonne === 'TERMINEE';
  const temps = tempsDeLaCarte(course, maintenant);
  const titre = avecRestaurant ? (nomCourtRestaurant(course.restaurant.nom) ?? course.restaurant.nom ?? course.reference) : course.reference;
  const ouvrir = () => openCourse(course.id);

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={ouvrir}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          ouvrir();
        }
      }}
      aria-label={`Course ${course.reference}`}
      className={`cursor-pointer rounded-xl border border-l-4 border-[#E4E4E7] bg-white p-3 shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition hover:border-[#F17922]/40 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F17922]/50 ${
        BORDURE[alerte?.ton ?? 'aucun']
      } ${terminee ? 'opacity-90' : ''}`}
    >
      <div className="flex items-start gap-2.5">
        <span
          className={`flex h-9 min-w-[44px] shrink-0 items-center justify-center rounded-lg px-1.5 text-base font-bold tabular-nums ${
            terminee ? 'bg-[#F4F4F5] text-[#52525B]' : 'bg-orange-50 text-[#F17922]'
          }`}
          title="Code de retrait"
        >
          {course.code ?? '–'}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-semibold text-[#18181B]" title={titre}>
            {titre}
          </p>
          <p className="truncate text-[11px] text-[#71717A]">
            {avecRestaurant ? `${course.reference} · ` : ''}
            {texteCommandes(course)}
          </p>
        </div>
        {temps && (
          <span
            className={`shrink-0 text-xs tabular-nums ${alerte?.ton === 'rouge' ? 'font-semibold text-red-600' : 'text-[#52525B]'}`}
            title={terminee ? 'Terminée à' : "Temps dans l'étape"}
          >
            {temps}
          </span>
        )}
      </div>

      {alerte && (
        <p className={`mt-2 flex items-start gap-1.5 rounded-md px-2 py-1 text-[11px] font-medium leading-4 ${TEXTE_ALERTE[alerte.ton]}`}>
          <AlertTriangle className="mt-px h-3 w-3 shrink-0" />
          <span className="min-w-0">{alerte.texte}</span>
        </p>
      )}

      {(course.turbo || course.proposee_a) && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {course.turbo && (
            <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-semibold text-violet-700">
              <Send className="h-3 w-3" />
              Turbo
            </span>
          )}
          {course.proposee_a && (
            <span className="rounded-full bg-[#F4F4F5] px-2 py-0.5 text-[10px] font-medium text-[#52525B]">
              Proposée à {course.proposee_a}
            </span>
          )}
        </div>
      )}

      <div className="mt-2.5">
        {terminee ? (
          <p className="truncate text-xs text-[#52525B]">{course.livreur ? nomDuLivreur(course.livreur) : course.turbo ? 'Livreur Turbo' : 'Aucun livreur'}</p>
        ) : (
          <ChoixLivreurCourse course={course} />
        )}
      </div>
    </article>
  );
}

export default CarteCourseEnDirect;
