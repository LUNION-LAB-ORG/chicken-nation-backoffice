'use client';

import { AlertTriangle, RotateCw } from 'lucide-react';
import React, { useMemo, useRef, useState } from 'react';

import { useDashboardStore } from '@/store/dashboardStore';

// ⚠️ Import RELATIF entre features : `@/` pointe sur src/, `features/` est à la racine.
import { useMaintenant } from '../../../livreurs/hook/use-maintenant';
import { useCoursesEnDirectQuery } from '../../queries/courses-en-direct.query';
import { useTableauLivraisonQuery } from '../../queries/tableau-livraison.query';
import type { ColonneEnDirect, CourseEnDirect } from '../../types/en-direct.types';
import {
  COLONNES,
  TERMINEES_VISIBLES,
  alerteDeCarte,
  colonneParDefaut,
  colonneVoisine,
  nombreDeLaColonne,
  parColonne,
  signauxParCourse,
} from '../../utils/en-direct';
import { CarteCourseEnDirect } from './CarteCourseEnDirect';

/**
 * KANBAN « EN DIRECT » DE L'ÉCRAN COURSES (demande du 10/11).
 *
 * Grand écran : les cinq colonnes côte à côte, chacune défile seule.
 * Téléphone et tablette : une colonne à la fois ; les colonnes en boutons
 * avec leur nombre en haut, et on glisse à gauche ou à droite pour passer à
 * la voisine.
 *
 * Données : `GET /courses/en-direct` (relu par le temps réel des courses et
 * toutes les 15 s) ; alertes des cartes : le tableau de la livraison, déjà lu
 * par le bandeau. Restaurant : celui du bandeau.
 */
export function TableauEnDirect({ onVoirHistorique }: { onVoirHistorique: () => void }) {
  const restaurantId = useDashboardStore((s) => s.selectedRestaurantId);
  const { data, isPending, isError, refetch, isFetching } = useCoursesEnDirectQuery(restaurantId);
  const { data: tableau } = useTableauLivraisonQuery();
  const maintenant = useMaintenant(30_000);
  const [colonneChoisie, setColonneChoisie] = useState<ColonneEnDirect | null>(null);
  const [toutesTerminees, setToutesTerminees] = useState(false);
  const depart = useRef<{ x: number; y: number } | null>(null);

  const groupes = useMemo(() => parColonne(data?.courses ?? []), [data]);
  const signaux = useMemo(() => signauxParCourse(tableau?.signaux), [tableau]);
  const colonneMobile = colonneChoisie ?? colonneParDefaut(groupes);
  const termineesTotal = data?.terminees_total ?? 0;
  const avecRestaurant = !restaurantId;

  if (isPending) return <Squelette />;
  if (isError && !data) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        <AlertTriangle className="h-4 w-4 shrink-0" />
        <span className="flex-1">Impossible de lire les courses en cours.</span>
        <button
          type="button"
          onClick={() => void refetch()}
          disabled={isFetching}
          className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-white px-2.5 py-1 text-xs font-semibold hover:bg-red-50 disabled:opacity-50"
        >
          <RotateCw className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin' : ''}`} />
          Réessayer
        </button>
      </div>
    );
  }

  const cartes = (cle: ColonneEnDirect, liste: CourseEnDirect[]) => {
    const terminee = cle === 'TERMINEE';
    const visibles = terminee && !toutesTerminees ? liste.slice(0, TERMINEES_VISIBLES) : liste;
    const reste = liste.length - visibles.length;
    return (
      <>
        {visibles.length === 0 ? (
          <p className="rounded-xl border border-dashed border-[#E4E4E7] px-3 py-6 text-center text-xs text-[#A1A1AA]">
            Aucune course
          </p>
        ) : (
          visibles.map((c) => (
            <CarteCourseEnDirect
              key={c.id}
              course={c}
              alerte={terminee ? null : alerteDeCarte(c, signaux)}
              maintenant={maintenant}
              avecRestaurant={avecRestaurant}
            />
          ))
        )}
        {terminee && (reste > 0 || toutesTerminees) && liste.length > TERMINEES_VISIBLES && (
          <button
            type="button"
            onClick={() => setToutesTerminees((v) => !v)}
            className="w-full rounded-lg px-2 py-1.5 text-left text-xs font-semibold text-[#F17922] hover:bg-orange-50"
          >
            {toutesTerminees ? 'Réduire' : reste === 1 ? "Voir l'autre" : `Voir les ${reste} autres`}
          </button>
        )}
        {terminee && termineesTotal > liste.length && (
          <button
            type="button"
            onClick={onVoirHistorique}
            className="w-full rounded-lg px-2 py-1.5 text-left text-xs font-semibold text-[#F17922] hover:bg-orange-50"
          >
            Toutes dans l&apos;historique
          </button>
        )}
      </>
    );
  };

  const pastille = (cle: ColonneEnDirect, choisie = false) => {
    const n = nombreDeLaColonne(cle, groupes, termineesTotal);
    const urgent = cle === 'A_AFFECTER' && n > 0;
    return (
      <span
        className={`min-w-[20px] rounded-full px-1.5 py-0.5 text-center text-[11px] font-semibold leading-none ${
          choisie ? 'bg-white text-[#F17922]' : urgent ? 'bg-red-100 text-red-700' : 'bg-[#F4F4F5] text-[#52525B]'
        }`}
      >
        {n}
      </span>
    );
  };

  return (
    <>
      {/* Grand écran : les cinq colonnes. */}
      <div className="hidden gap-3 lg:grid lg:grid-cols-5">
        {COLONNES.map(({ cle, titre }) => (
          <section
            key={cle}
            aria-label={titre}
            className="flex min-w-0 flex-col rounded-2xl bg-[#F4F4F5]/70 p-2"
          >
            <h3 className="flex items-center justify-between gap-2 px-1.5 pb-2 pt-1 text-[13px] font-semibold text-[#18181B]">
              <span className="truncate">{titre}</span>
              {pastille(cle)}
            </h3>
            <div className="flex max-h-[calc(100dvh-20rem)] min-h-[120px] flex-col gap-2 overflow-y-auto pr-0.5 scrollbar-thin scrollbar-thumb-[#E4E4E7] scrollbar-track-transparent">
              {cartes(cle, groupes[cle])}
            </div>
          </section>
        ))}
      </div>

      {/* Téléphone et tablette : une colonne à la fois. */}
      <div className="lg:hidden">
        <div
          role="tablist"
          aria-label="Colonnes"
          className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-2 scrollbar-none"
        >
          {COLONNES.map(({ cle, titre }) => {
            const choisie = cle === colonneMobile;
            return (
              <button
                key={cle}
                type="button"
                role="tab"
                aria-selected={choisie}
                onClick={() => setColonneChoisie(cle)}
                className={`inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3 text-[13px] font-semibold transition-colors ${
                  choisie
                    ? 'border-[#F17922] bg-[#F17922] text-white'
                    : 'border-[#E4E4E7] bg-white text-[#18181B]'
                }`}
              >
                {titre}
                {pastille(cle, choisie)}
              </button>
            );
          })}
        </div>
        <div
          className="flex flex-col gap-2 pt-1"
          onTouchStart={(e) => {
            const t = e.touches[0];
            depart.current = { x: t.clientX, y: t.clientY };
          }}
          onTouchEnd={(e) => {
            const d = depart.current;
            depart.current = null;
            if (!d) return;
            const t = e.changedTouches[0];
            const dx = t.clientX - d.x;
            const dy = t.clientY - d.y;
            // Un vrai glissé de côté (pas un défilement) : colonne voisine.
            if (Math.abs(dx) > 60 && Math.abs(dx) > 2 * Math.abs(dy)) {
              setColonneChoisie(colonneVoisine(colonneMobile, dx < 0 ? 1 : -1));
            }
          }}
        >
          {cartes(colonneMobile, groupes[colonneMobile])}
        </div>
      </div>
    </>
  );
}

function Squelette() {
  return (
    <div aria-hidden className="grid gap-3 lg:grid-cols-5">
      {[0, 1, 2, 3, 4].map((i) => (
        <div key={i} className={`space-y-2 rounded-2xl bg-[#F4F4F5]/70 p-2 ${i > 0 ? 'hidden lg:block' : ''}`}>
          <div className="h-4 w-24 animate-pulse rounded-full bg-[#E4E4E7]" />
          {[0, 1].map((j) => (
            <div key={j} className="h-24 animate-pulse rounded-xl bg-white" />
          ))}
        </div>
      ))}
    </div>
  );
}

export default TableauEnDirect;
