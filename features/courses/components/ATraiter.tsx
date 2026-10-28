'use client';

import { useQueryClient } from '@tanstack/react-query';
import { RotateCw, Send, Undo2, UserPlus } from 'lucide-react';
import React, { useState } from 'react';
import { toast } from 'react-hot-toast';

import { useDashboardStore } from '@/store/dashboardStore';

import { useDroitsLivraison } from '../../livreurs/hook/use-droits-livraison';
import { useSacRapporteMutation } from '../../operations/queries/sac-rapporte.mutation';
import { LIBELLE_SAC_RAPPORTE, peutRapporterSac } from '../../operations/utils/sac-a-rapporter';
import { useDroitsCommande } from '../../orders/hooks/useDroitsCommande';
import { useOuvrirCommande } from '../../orders/hooks/useOuvrirCommande';
import { useAuthStore } from '../../users/hook/authStore';
import { courseDetailQueryOption } from '../queries/course-detail.query';
import { useCourseRelancerMutation, useCourseVersTurboMutation } from '../queries/course-fleet.mutation';
import { useCourseRetryMutation } from '../queries/course-retry.mutation';
import { useRelanceLivraisonMutation } from '../queries/relance-livraison.mutation';
import { useTableauLivraisonQuery } from '../queries/tableau-livraison.query';
import type { SignalLivraison } from '../types/tableau-livraison.types';
import { LIBELLE_RELANCER_LIVRAISON, peutRelancerLivraison } from '../utils/relance-livraison';
import { situationCourse } from '../utils/textes-signaux';
import {
  actionsATraiter,
  commandeDuSignal,
  relanceLivraisonDuSignal,
  sacRapporteDuSignal,
  signauxATraiter,
  type ActionATraiter,
} from '../utils/tableau-livraison';

/**
 * « À TRAITER » au-dessus du tableau des courses (conception du 24/10, 10.1).
 *
 * Les alertes du serveur qui portent une course (sans livreur, tournée en
 * retard, parti sans une commande, attente au restaurant, annulée à
 * relancer, livraison annulée par le livreur), filtrées par le restaurant du
 * bandeau. Toucher une ligne ouvre la fiche de la course ; une livraison
 * annulée par le livreur, pour une seule commande, mène à cette commande
 * (page Commandes, à qui peut les lire), car c'est elle qu'il faut reprendre.
 *
 * Gestes à droite, pour qui pilote les courses (l'admin) seulement :
 * « Forcer l'affectation » et « Confier à Turbo » sur une recherche en
 * cours, « Relancer la recherche » quand elle est finie, « Relancer la
 * livraison » sur une course annulée.
 *
 * « Sac rapporté » (28/10) sur la ligne « Koffi a annulé ORD-1 · Client
 * absent » qui porte une seule commande, pour les rôles admis par le serveur
 * (dans les faits l'admin : les comptes de restaurant n'ont pas cet écran).
 * Un toucher, sans confirmation : la commande redevient prête.
 *
 * « Relancer la livraison » (28/10) sur la même ligne, à gauche de « Sac
 * rapporté », pour qui pilote les courses (administrateur, centre d'appels) :
 * la livraison repart avec le même livreur, sans passage au restaurant. Un
 * toucher, sans confirmation. Même condition que « Sac rapporté » : une
 * seule commande, avec son identifiant.
 *
 * Absente quand il n'y a rien, pendant le chargement, en erreur et avec un
 * serveur qui n'a pas la route.
 */

const VISIBLES = 5;

const LIBELLES: Record<ActionATraiter, string> = {
  FORCER: "Forcer l'affectation",
  TURBO: 'Confier à Turbo',
  RELANCER_RECHERCHE: 'Relancer la recherche',
  RELANCER_LIVRAISON: 'Relancer la livraison',
};

const ICONES: Record<ActionATraiter, React.FC<{ className?: string }>> = {
  FORCER: UserPlus,
  TURBO: Send,
  RELANCER_RECHERCHE: RotateCw,
  RELANCER_LIVRAISON: RotateCw,
};

export function ATraiter() {
  const selectedRestaurantId = useDashboardStore((s) => s.selectedRestaurantId);
  const openCourse = useDashboardStore((s) => s.openCourse);
  const setSelectedItem = useDashboardStore((s) => s.setSelectedItem);
  const toggleModal = useDashboardStore((s) => s.toggleModal);
  const droitsLivraison = useDroitsLivraison();
  const { piloterCourses } = droitsLivraison;
  const peutRelancer = peutRelancerLivraison(droitsLivraison);
  const ouvrirCommande = useOuvrirCommande();
  const queryClient = useQueryClient();
  const [tout, setTout] = useState(false);
  const [ouverture, setOuverture] = useState<string | null>(null);

  const { data, isError } = useTableauLivraisonQuery();
  const { mutate: versTurbo, isPending: envoiTurbo, variables: turboId } = useCourseVersTurboMutation();
  const { mutate: relancerRecherche, isPending: relanceRecherche, variables: rechercheId } = useCourseRetryMutation();
  const { mutate: relancerLivraison, isPending: relanceLivraison, variables: livraisonId } =
    useCourseRelancerMutation();
  const { peutChangerStatut } = useDroitsCommande();
  const membre = useAuthStore((s) => s.user);
  const peutRapporter = peutRapporterSac(peutChangerStatut, membre);
  const { mutate: rapporterSac, isPending: envoiSac, variables: sacEnvoye } = useSacRapporteMutation();
  const {
    mutate: relancerCommande,
    isPending: envoiRelance,
    variables: relanceEnvoyee,
  } = useRelanceLivraisonMutation();
  // Un seul envoi à la fois entre « Relancer la livraison » et « Sac rapporté ».
  const envoiGeste = envoiSac || envoiRelance;

  if (!data || isError) return null;
  const signaux = signauxATraiter(data.signaux, selectedRestaurantId);
  if (signaux.length === 0) return null;

  const nomsRestaurants = new Map(data.restaurants.map((r) => [r.id, r.nom]));
  const visibles = tout ? signaux : signaux.slice(0, VISIBLES);
  const reste = signaux.length - VISIBLES;

  // La fenêtre « Forcer l'affectation » lit la course entière (restaurant, livreurs du restaurant).
  const forcer = async (courseId: string) => {
    setOuverture(courseId);
    try {
      const course = await queryClient.fetchQuery(courseDetailQueryOption(courseId));
      setSelectedItem('courses', course);
      if (!useDashboardStore.getState().courses.modals?.force_assign) toggleModal('courses', 'force_assign');
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setOuverture(null);
    }
  };

  const enCours = (action: ActionATraiter, courseId: string): boolean => {
    if (action === 'FORCER') return ouverture === courseId;
    if (action === 'TURBO') return envoiTurbo && turboId === courseId;
    if (action === 'RELANCER_RECHERCHE') return relanceRecherche && rechercheId === courseId;
    return relanceLivraison && livraisonId === courseId;
  };

  const agir = (action: ActionATraiter, courseId: string) => {
    if (action === 'FORCER') void forcer(courseId);
    else if (action === 'TURBO') versTurbo(courseId);
    else if (action === 'RELANCER_RECHERCHE') relancerRecherche(courseId);
    else relancerLivraison(courseId);
  };

  // Ligne sur une rangée quand « À traiter » a la place (56rem) ; plus étroit :
  // référence et situation en haut, restaurant et gestes dessous, gestes en
  // icône seule sous 36rem. La situation garde toujours sa largeur.
  const ligne = (s: SignalLivraison, index: number) => {
    const course = s.course!;
    const actions = piloterCourses ? actionsATraiter(s) : [];
    const situation = situationCourse(s);
    const restaurant = selectedRestaurantId ? null : (nomsRestaurants.get(s.restaurant_id) ?? null);
    const commande = ouvrirCommande ? commandeDuSignal(s) : null;
    const sacId = peutRapporter ? sacRapporteDuSignal(s) : null;
    const relanceId = peutRelancer ? relanceLivraisonDuSignal(s) : null;
    return (
      <li
        key={`${s.cle}-${course.id}-${index}`}
        onClick={() => (commande && ouvrirCommande ? ouvrirCommande(commande) : openCourse(course.id))}
        className="flex cursor-pointer flex-col gap-1.5 border-t border-slate-100 px-3 py-2 text-sm first:border-t-0 hover:bg-orange-50/40 @4xl:h-12 @4xl:flex-row @4xl:items-center @4xl:gap-3 @4xl:py-0"
      >
        <span className="flex min-w-0 items-center gap-3 @4xl:contents">
          <span
            className={`h-2 w-2 shrink-0 rounded-full ${s.gravite === 'rouge' ? 'bg-red-600' : 'bg-amber-500'}`}
            aria-hidden
          />
          <span className="max-w-36 shrink-0 truncate font-medium text-gray-900 @4xl:w-36" title={course.reference}>
            {course.reference}
          </span>
          {restaurant && (
            <span className="hidden w-28 shrink-0 truncate text-gray-600 @4xl:block" title={restaurant}>
              {restaurant}
            </span>
          )}
          <span
            className={`min-w-0 flex-1 truncate ${s.gravite === 'rouge' ? 'text-red-700' : 'text-amber-800'}`}
            title={situation}
          >
            {situation}
          </span>
        </span>
        {(restaurant || actions.length > 0 || relanceId || sacId) && (
          <span className="flex min-w-0 items-center gap-2 pl-5 @4xl:contents">
            {restaurant && (
              <span className="min-w-0 flex-1 truncate text-xs text-gray-600 @4xl:hidden" title={restaurant}>
                {restaurant}
              </span>
            )}
            {(actions.length > 0 || relanceId || sacId) && (
              <span className="ml-auto flex shrink-0 items-center gap-2">
                {actions.map((action) => {
                  const Icone = ICONES[action];
                  const occupe = enCours(action, course.id);
                  return (
                    <button
                      key={action}
                      type="button"
                      disabled={occupe}
                      title={LIBELLES[action]}
                      aria-label={LIBELLES[action]}
                      onClick={(e) => {
                        e.stopPropagation();
                        agir(action, course.id);
                      }}
                      className={`inline-flex h-8 items-center gap-1.5 rounded-lg px-2 text-xs font-semibold transition disabled:opacity-60 @xl:px-3 ${
                        action === 'FORCER'
                          ? 'bg-[#F17922] text-white hover:opacity-90'
                          : 'border border-[#F17922] text-[#F17922] hover:bg-orange-50'
                      }`}
                    >
                      <Icone className={`h-3.5 w-3.5 ${occupe ? 'animate-spin' : ''}`} />
                      <span className="hidden @xl:inline">{LIBELLES[action]}</span>
                    </button>
                  );
                })}
                {relanceId && (
                  <button
                    type="button"
                    disabled={envoiGeste}
                    title={LIBELLE_RELANCER_LIVRAISON}
                    aria-label={LIBELLE_RELANCER_LIVRAISON}
                    onClick={(e) => {
                      e.stopPropagation();
                      relancerCommande({ orderId: relanceId, reference: s.commandes[0] ?? null });
                    }}
                    className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-[#F17922] px-2 text-xs font-semibold text-[#F17922] transition hover:bg-orange-50 disabled:opacity-60 @xl:px-3"
                  >
                    <RotateCw
                      className={`h-3.5 w-3.5 ${envoiRelance && relanceEnvoyee?.orderId === relanceId ? 'animate-spin' : ''}`}
                    />
                    <span className="hidden @xl:inline">{LIBELLE_RELANCER_LIVRAISON}</span>
                  </button>
                )}
                {sacId && (
                  <button
                    type="button"
                    disabled={envoiGeste}
                    title={LIBELLE_SAC_RAPPORTE}
                    aria-label={LIBELLE_SAC_RAPPORTE}
                    onClick={(e) => {
                      e.stopPropagation();
                      rapporterSac({ orderId: sacId, reference: s.commandes[0] ?? null });
                    }}
                    className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-[#F17922] px-2 text-xs font-semibold text-[#F17922] transition hover:bg-orange-50 disabled:opacity-60 @xl:px-3"
                  >
                    <Undo2
                      className={`h-3.5 w-3.5 ${envoiSac && sacEnvoye?.orderId === sacId ? 'animate-pulse' : ''}`}
                    />
                    <span className="hidden @xl:inline">{LIBELLE_SAC_RAPPORTE}</span>
                  </button>
                )}
              </span>
            )}
          </span>
        )}
      </li>
    );
  };

  return (
    <section className="@container rounded-xl border border-slate-300 bg-white">
      <h2 className="flex items-center gap-2 px-3 pt-3 pb-2 text-sm font-semibold text-gray-900">
        À traiter
        <span className="rounded-full bg-red-100 px-1.5 py-0.5 text-[11px] font-semibold leading-none text-red-700">
          {signaux.length}
        </span>
      </h2>
      <ul>{visibles.map(ligne)}</ul>
      {reste > 0 && (
        <button
          type="button"
          onClick={() => setTout((v) => !v)}
          className="w-full border-t border-slate-100 px-3 py-2 text-left text-xs font-semibold text-[#F17922] hover:bg-orange-50/40"
        >
          {tout ? 'Réduire' : reste === 1 ? "Voir l'autre" : `Voir les ${reste} autres`}
        </button>
      )}
    </section>
  );
}

export default ATraiter;
