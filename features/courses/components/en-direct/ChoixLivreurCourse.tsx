'use client';

import { Check, ChevronDown, Search, UserRound, X } from 'lucide-react';
import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

// ⚠️ Import RELATIF entre features : `@/` pointe sur src/, `features/` est à la racine.
import BoutonAppelerLivreur from '../../../calls/components/BoutonAppelerLivreur';
import { BoutonDebloquer } from '../../../livreurs/components/BoutonDebloquer';
import { PastilleEtat } from '../../../livreurs/components/PastilleEtat';
import { useDroitsLivraison } from '../../../livreurs/hook/use-droits-livraison';
import { useMaintenant } from '../../../livreurs/hook/use-maintenant';
import {
  appliActiveDe,
  appliEtatDe,
  choixAffectation,
  comparerPourAffectation,
} from '../../../livreurs/utils/disponibilite';
import { sousTitreAffectation } from '../../../operations/utils/affectation-commande';
import { useChangerLivreurMutation } from '../../queries/changer-livreur.mutation';
import { useLivreursPourCourseQuery } from '../../queries/courses-en-direct.query';
import type { CourseEnDirect } from '../../types/en-direct.types';
import { correspondRecherche, nomDuLivreur, peutPrendreCourse } from '../../utils/en-direct';

/**
 * MENU « LIVREUR » D'UNE CARTE DU KANBAN (demande du 10/11) : changer le
 * livreur d'une course d'office, avant le départ du restaurant.
 *
 *  - Bouton : le livreur actuel (ou « Choisir un livreur »).
 *  - Liste : ceux qui peuvent prendre la course d'abord (ceux du restaurant,
 *    puis les renforts, avec leur restaurant et leur distance), les autres
 *    grisés avec la raison ; recherche par nom ou téléphone ; « Débloquer »
 *    à côté d'un livreur en pause automatique.
 *  - Un toucher sur un livreur suffit : le serveur confie la course et dit
 *    ce qu'il a fait (« CRS-… confiée à Koffi. »).
 *
 * Sur grand écran, la liste s'ouvre sous le bouton (hors de la colonne, qui
 * défile) ; sur téléphone, en feuille au bas de l'écran.
 *
 * Course partie, confiée à Turbo, ou compte qui ne pilote pas les courses :
 * le nom du livreur seul, avec le bouton d'appel.
 */
export function ChoixLivreurCourse({ course }: { course: CourseEnDirect }) {
  const { piloterCourses } = useDroitsLivraison();
  const modifiable = piloterCourses && course.livreur_modifiable;

  if (!modifiable) {
    if (!course.livreur) {
      return (
        <p className="flex h-8 items-center gap-1.5 text-xs text-[#71717A]">
          <UserRound className="h-3.5 w-3.5" />
          {course.turbo ? 'Livreur Turbo' : 'Aucun livreur'}
        </p>
      );
    }
    const nom = nomDuLivreur(course.livreur);
    return (
      <div className="flex h-8 items-center gap-2">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#F4F4F5] text-[10px] font-bold text-[#52525B]">
          {(course.livreur.prenom ?? 'L').trim().charAt(0).toUpperCase()}
        </span>
        <span className="min-w-0 flex-1 truncate text-xs font-medium text-[#18181B]" title={nom}>
          {nom}
        </span>
        <span onClick={(e) => e.stopPropagation()}>
          <BoutonAppelerLivreur variante="icone" delivererId={course.livreur.id} nom={nom} detail={course.restaurant.nom} />
        </span>
      </div>
    );
  }
  return <MenuLivreur course={course} />;
}

const LARGEUR_LISTE = 300;

function MenuLivreur({ course }: { course: CourseEnDirect }) {
  const [ouvert, setOuvert] = useState(false);
  const [recherche, setRecherche] = useState('');
  const [place, setPlace] = useState<{ haut: number; gauche: number; versLeHaut: boolean } | null>(null);
  const [petitEcran, setPetitEcran] = useState(false);
  const boutonRef = useRef<HTMLButtonElement>(null);
  const listeRef = useRef<HTMLDivElement>(null);
  const maintenant = useMaintenant(10_000, ouvert);
  const { data, isLoading, isError } = useLivreursPourCourseQuery(course.id, ouvert);
  const changer = useChangerLivreurMutation();

  // Position de la liste, recalculée à l'ouverture ; fermée si la page défile.
  useLayoutEffect(() => {
    if (!ouvert || !boutonRef.current) return;
    const petit = window.matchMedia('(max-width: 639px)').matches;
    setPetitEcran(petit);
    if (petit) return;
    const r = boutonRef.current.getBoundingClientRect();
    const versLeHaut = window.innerHeight - r.bottom < 360 && r.top > 360;
    const gauche = Math.min(Math.max(8, r.left), window.innerWidth - LARGEUR_LISTE - 8);
    setPlace({ haut: versLeHaut ? r.top - 6 : r.bottom + 6, gauche, versLeHaut });
  }, [ouvert]);

  useEffect(() => {
    if (!ouvert) return;
    const fermerSiDehors = (e: MouseEvent) => {
      const cible = e.target as Node;
      if (listeRef.current?.contains(cible) || boutonRef.current?.contains(cible)) return;
      setOuvert(false);
    };
    const echap = (e: KeyboardEvent) => e.key === 'Escape' && setOuvert(false);
    const defile = (e: Event) => {
      if (listeRef.current?.contains(e.target as Node)) return;
      if (!window.matchMedia('(max-width: 639px)').matches) setOuvert(false);
    };
    document.addEventListener('mousedown', fermerSiDehors);
    document.addEventListener('keydown', echap);
    window.addEventListener('scroll', defile, true);
    window.addEventListener('resize', defile);
    return () => {
      document.removeEventListener('mousedown', fermerSiDehors);
      document.removeEventListener('keydown', echap);
      window.removeEventListener('scroll', defile, true);
      window.removeEventListener('resize', defile);
    };
  }, [ouvert]);

  const lignes = useMemo(
    () =>
      (data?.items ?? [])
        .filter((l) => correspondRecherche(l, recherche))
        .map((livreur) => {
          const etat = choixAffectation(livreur.disponibilite, course.id, maintenant, appliActiveDe(livreur), appliEtatDe(livreur));
          const actuel = livreur.id === course.livreur?.id;
          const enCourse = livreur.disponibilite?.en_course === true;
          const selectionnable = !actuel && peutPrendreCourse(livreur.disponibilite);
          const raison = actuel ? 'A déjà cette course' : enCourse ? 'Déjà en course' : etat.raison;
          return {
            livreur,
            actuel,
            nom: [livreur.first_name, livreur.last_name].filter(Boolean).join(' ') || 'Livreur',
            choix: { ...etat, selectionnable },
            raison,
            sousTitre: sousTitreAffectation(livreur, false),
          };
        })
        .sort((a, b) =>
          a.actuel !== b.actuel
            ? a.actuel
              ? -1
              : 1
            : a.choix.selectionnable === b.choix.selectionnable &&
                a.choix.etat === b.choix.etat &&
                !a.livreur.renfort !== !b.livreur.renfort
              ? a.livreur.renfort
                ? 1
                : -1
              : comparerPourAffectation(a, b),
        ),
    [data, recherche, course.id, course.livreur?.id, maintenant],
  );

  const choisir = (delivererId: string) =>
    changer.mutate(
      { courseId: course.id, delivererId },
      {
        onSuccess: () => {
          setOuvert(false);
          setRecherche('');
        },
      },
    );

  const libelle = course.livreur ? nomDuLivreur(course.livreur) : 'Choisir un livreur';

  const liste = (
    <div
      ref={listeRef}
      role="dialog"
      aria-label={`Livreur de ${course.reference}`}
      onClick={(e) => e.stopPropagation()}
      className={
        petitEcran
          ? 'fixed inset-x-0 bottom-0 z-[70] flex max-h-[75dvh] flex-col rounded-t-2xl bg-white shadow-2xl'
          : 'fixed z-[70] flex max-h-[360px] flex-col overflow-hidden rounded-xl border border-[#E4E4E7] bg-white shadow-xl'
      }
      style={
        petitEcran || !place
          ? undefined
          : {
              width: LARGEUR_LISTE,
              left: place.gauche,
              ...(place.versLeHaut ? { bottom: window.innerHeight - place.haut } : { top: place.haut }),
            }
      }
    >
      {petitEcran && (
        <div className="flex items-center justify-between px-4 pb-1 pt-3">
          <p className="text-sm font-semibold text-[#18181B]">
            Livreur de <span className="tabular-nums">{course.code ?? course.reference}</span>
          </p>
          <button
            type="button"
            onClick={() => setOuvert(false)}
            aria-label="Fermer"
            className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-[#F4F4F5]"
          >
            <X className="h-4 w-4 text-[#52525B]" />
          </button>
        </div>
      )}
      <label className="mx-3 my-2 flex items-center gap-2 rounded-lg border border-[#E4E4E7] bg-[#FAFAFA] px-2.5">
        <Search className="h-3.5 w-3.5 shrink-0 text-[#A1A1AA]" />
        <input
          autoFocus={!petitEcran}
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          placeholder="Rechercher un livreur"
          className="h-8 min-w-0 flex-1 bg-transparent text-sm text-[#18181B] outline-none placeholder:text-[#A1A1AA]"
        />
      </label>
      <div className="min-h-0 flex-1 overflow-y-auto pb-2">
        {isLoading ? (
          <p className="px-4 py-3 text-sm text-[#71717A]">Chargement des livreurs…</p>
        ) : isError ? (
          <p className="px-4 py-3 text-sm text-red-600">Impossible de lire les livreurs.</p>
        ) : lignes.length === 0 ? (
          <p className="px-4 py-3 text-sm text-[#71717A]">
            {recherche ? 'Aucun livreur trouvé.' : 'Aucun livreur actif pour ce restaurant ni à proximité.'}
          </p>
        ) : (
          <ul>
            {lignes.map(({ livreur, actuel, nom, choix, raison, sousTitre }) => (
              <li key={livreur.id} className="flex items-center gap-2 pr-3">
                <button
                  type="button"
                  disabled={!choix.selectionnable || changer.isPending}
                  title={choix.selectionnable ? undefined : (raison ?? undefined)}
                  onClick={() => choisir(livreur.id)}
                  className={`flex min-w-0 flex-1 items-center gap-2.5 px-3 py-2 text-left transition-colors ${
                    choix.selectionnable ? 'hover:bg-orange-50' : 'cursor-not-allowed'
                  }`}
                >
                  <span className={`min-w-0 flex-1 ${choix.selectionnable || actuel ? '' : 'opacity-50'}`}>
                    <span className="flex items-center gap-1.5">
                      <span className="truncate text-sm font-medium text-[#18181B]" title={nom}>
                        {nom}
                      </span>
                      {actuel && <Check className="h-3.5 w-3.5 shrink-0 text-[#F17922]" aria-label="Livreur actuel" />}
                    </span>
                    <span className="block truncate text-[11px] text-[#71717A]">
                      {choix.selectionnable || actuel ? sousTitre : raison}
                    </span>
                  </span>
                  {choix.etat && <PastilleEtat etat={choix.etat} title={choix.libelle ?? undefined} />}
                </button>
                {choix.etat === 'PAUSE_AUTO' && <BoutonDebloquer livreurId={livreur.id} />}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );

  return (
    <>
      <button
        ref={boutonRef}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={ouvert}
        disabled={changer.isPending}
        onClick={(e) => {
          e.stopPropagation();
          setOuvert((v) => !v);
        }}
        onKeyDown={(e) => e.stopPropagation()}
        className={`flex h-8 w-full items-center gap-2 rounded-lg border px-2 text-left text-xs transition-colors disabled:opacity-60 ${
          course.livreur
            ? 'border-[#E4E4E7] bg-white text-[#18181B] hover:border-[#F17922]/60'
            : 'border-dashed border-[#F17922] bg-orange-50/60 font-semibold text-[#C2410C] hover:bg-orange-50'
        }`}
      >
        <span
          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
            course.livreur ? 'bg-[#F4F4F5] text-[#52525B]' : 'bg-white text-[#F17922]'
          }`}
        >
          {course.livreur ? (course.livreur.prenom ?? 'L').trim().charAt(0).toUpperCase() : <UserRound className="h-3 w-3" />}
        </span>
        <span className="min-w-0 flex-1 truncate">{changer.isPending ? 'Envoi…' : libelle}</span>
        <ChevronDown className={`h-3.5 w-3.5 shrink-0 transition-transform ${ouvert ? 'rotate-180' : ''}`} />
      </button>
      {ouvert && typeof document !== 'undefined' && (petitEcran || place) && createPortal(
        <>
          {petitEcran && (
            <div className="fixed inset-0 z-[69] bg-black/40" onClick={(e) => (e.stopPropagation(), setOuvert(false))} />
          )}
          {liste}
        </>,
        document.body,
      )}
    </>
  );
}

export default ChoixLivreurCourse;
