'use client';

import { AlertTriangle, Check, ChevronDown } from 'lucide-react';
import React, { useState } from 'react';

import { useDashboardStore } from '@/store/dashboardStore';

// ⚠️ Import RELATIF entre features : `@/` pointe sur src/, `features/` est à la racine.
import { useDroitsLivraison } from '../../../livreurs/hook/use-droits-livraison';
import { formatPrix } from '../../../operations/utils/carte-operations';
import { useOuvrirCommande } from '../../../orders/hooks/useOuvrirCommande';
import { nomCourtRestaurant } from '../../../restaurants/utils/nom-court';
import type { CourseEnDirect } from '../../types/en-direct.types';
import type { TonCarte } from '../../utils/en-direct';
import { basculeFlotte, finDeReference, ligneDeLaCarte, texteEtape } from '../../utils/en-direct';
import { BadgeFlotte } from './BadgeFlotte';
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
 *    restaurant (sur « Tous ») ou la référence ;
 *  - dessous, les commandes et le temps EN TOUTES LETTRES (retour du 10/11 :
 *    « 45 min » seul ne disait pas ce qu'il comptait) : « attend depuis
 *    12 min », « en route depuis 5 min », « au restaurant depuis 8 min »,
 *    « parti à 21 h 46 ». Un clic sur cette ligne déplie les commandes
 *    (11/11) : fin de la référence, montant, client, livrée ; la référence
 *    mène à la commande. Un second clic replie ;
 *  - l'étape d'une course Turbo (« Turbo cherche un livreur ») ;
 *  - l'alerte du tableau de la livraison, s'il y en a une, bord gauche de sa
 *    couleur ;
 *  - le badge Turbo qui agit (reprendre en interne, confier à Turbo), à qui
 *    l'offre est proposée ;
 *  - le livreur : son nom ouvre sa fiche rapide (numéro), « Changer » avant
 *    le départ.
 *
 * Toucher le reste de la carte ouvre la fiche de la course.
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
  const ligne = ligneDeLaCarte(course, maintenant);
  const etape = texteEtape(course);
  const { piloterCourses } = useDroitsLivraison();
  const avecBadges = course.turbo || !!course.proposee_a || (piloterCourses && basculeFlotte(course) !== null);
  const titre = avecRestaurant ? (nomCourtRestaurant(course.restaurant.nom) ?? course.restaurant.nom ?? course.reference) : course.reference;
  const ouvrir = () => openCourse(course.id);
  const [details, setDetails] = useState(false);
  const commandes = course.commandes.liste ?? [];
  const ouvrirCommande = useOuvrirCommande();
  const stop = (e: React.SyntheticEvent) => e.stopPropagation();
  const couleurLigne = course.etape === 'AU_RESTAURANT' ? 'font-medium text-sky-800' : 'text-[#52525B]';

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
      }`}
    >
      <div className="flex items-start gap-2.5">
        <span
          className={`flex h-9 min-w-[44px] shrink-0 items-center justify-center rounded-lg px-1.5 text-base font-bold tabular-nums ${
            course.turbo ? 'bg-violet-50 text-violet-700' : 'bg-orange-50 text-[#F17922]'
          }`}
          title="Code de retrait"
        >
          {course.code ?? '–'}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-semibold text-[#18181B]" title={titre}>
            {titre}
          </p>
          {commandes.length > 0 ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setDetails((v) => !v);
              }}
              onKeyDown={stop}
              aria-expanded={details}
              title={details ? 'Masquer les commandes' : 'Voir les commandes'}
              className={`-mx-1 flex max-w-full items-center gap-1 rounded px-1 text-left text-[11px] transition-colors hover:bg-[#F4F4F5] ${couleurLigne}`}
            >
              <span className="truncate">{ligne}</span>
              <ChevronDown className={`h-3 w-3 shrink-0 text-[#A1A1AA] transition-transform ${details ? 'rotate-180' : ''}`} />
            </button>
          ) : (
            <p className={`truncate text-[11px] ${couleurLigne}`} title={ligne}>
              {ligne}
            </p>
          )}
          {avecRestaurant && <p className="truncate text-[10px] text-[#A1A1AA]">{course.reference}</p>}
        </div>
      </div>

      {details && commandes.length > 0 && (
        <ul onClick={stop} onKeyDown={stop} className="mt-2 cursor-default space-y-1 rounded-lg bg-[#FAFAFA] px-2 py-1.5">
          {commandes.map((c) => (
            <li
              key={c.reference}
              className={`flex items-center gap-2 text-[11px] ${c.annulee ? 'text-[#A1A1AA] line-through' : 'text-[#52525B]'}`}
            >
              {ouvrirCommande ? (
                <button
                  type="button"
                  onClick={() => ouvrirCommande(c.reference)}
                  title={`Voir la commande ${c.reference}`}
                  className="shrink-0 font-mono font-semibold text-[#18181B] underline-offset-2 hover:text-[#F17922] hover:underline"
                >
                  {finDeReference(c.reference)}
                </button>
              ) : (
                <span className="shrink-0 font-mono font-semibold text-[#18181B]" title={c.reference}>
                  {finDeReference(c.reference)}
                </span>
              )}
              <span className="shrink-0 font-semibold tabular-nums">{formatPrix(c.montant)}</span>
              <span className="min-w-0 flex-1 truncate" title={c.client ?? undefined}>
                {c.client ?? 'Client'}
              </span>
              {c.livree && <Check className="h-3 w-3 shrink-0 text-green-600" aria-label="Livrée" />}
            </li>
          ))}
        </ul>
      )}

      {etape && (
        <p className="mt-2 inline-flex rounded-md bg-violet-50 px-2 py-0.5 text-[11px] font-medium text-violet-800">{etape}</p>
      )}

      {alerte && (
        <p className={`mt-2 flex items-start gap-1.5 rounded-md px-2 py-1 text-[11px] font-medium leading-4 ${TEXTE_ALERTE[alerte.ton]}`}>
          <AlertTriangle className="mt-px h-3 w-3 shrink-0" />
          <span className="min-w-0">{alerte.texte}</span>
        </p>
      )}

      {avecBadges && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          <BadgeFlotte course={course} />
          {course.proposee_a && (
            <span className="rounded-full bg-[#F4F4F5] px-2 py-0.5 text-[10px] font-medium text-[#52525B]">
              Proposée à {course.proposee_a}
            </span>
          )}
        </div>
      )}

      <div className="mt-2.5">
        <ChoixLivreurCourse course={course} />
      </div>
    </article>
  );
}

export default CarteCourseEnDirect;
