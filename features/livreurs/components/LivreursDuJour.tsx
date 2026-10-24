'use client';

import { AlertTriangle, ChevronDown, ChevronRight, RotateCw } from 'lucide-react';
import React, { useMemo, useState } from 'react';

import { useTableauLivraisonQuery } from '../../courses/queries/tableau-livraison.query';
import type { TableauLivraison } from '../../courses/types/tableau-livraison.types';
import { nomLivreur } from '../../calls/utils/appel-livreur';
import { useMaintenant } from '../hook/use-maintenant';
import { useDelivererLiveLocationsQuery } from '../queries/deliverer-live.query';
import type { IDelivererLive } from '../types/deliverer-live.type';
import type { EtatDisponibilite } from '../types/livreur.types';
import { appliVueADe, etatLivreurAffiche } from '../utils/disponibilite';
import {
  comparerLivreursDuJour,
  correspondALaRecherche,
  detailEtatDuJour,
  dureeEnLigne,
  enTeteRestaurant,
  estEnService,
  estReplie,
  messageAucunLivreur,
  planningDuJour,
  rangDuLivreur,
  type DetailEtat,
} from '../utils/livreurs-du-jour';
import { COLONNES_AVEC_JOUR, COLONNES_SANS_JOUR, LigneLivreurDuJour } from './LigneLivreurDuJour';

/**
 * LIVREURS « AUJOURD'HUI » (conception du 24/10, 10.2) : un bloc par
 * restaurant (grille de 1 à 3 colonnes sur « Tous »), une ligne par livreur.
 *
 * Données : `GET /deliverers/live-locations?includeOffline=true&jour=true`,
 * relue toutes les 60 s ; nombre de prévus et « Prévu ce matin, pas en
 * service » viennent du tableau de la livraison quand le serveur l'a.
 *
 * Tri : état (ceux qui peuvent partir d'abord), puis place dans la file. Les
 * hors service sont repliés sous « Hors service 2 », sauf ceux qui sont
 * attendus au créneau en cours.
 */

export interface LivreursDuJourProps {
  /** Restaurant du bandeau ; null : tous. */
  restaurantId: string | null;
  /** Recherche du titre de l'écran (nom, prénom ; le champ l'annonce, `RECHERCHE_AUJOURDHUI`). */
  recherche?: string;
  /** Toucher une ligne : fiche du livreur. */
  onOuvrir: (livreurId: string) => void;
}

interface LigneCalculee {
  live: IDelivererLive;
  etat: EtatDisponibilite;
  libelleEtat: string;
  rang: number | null;
  nom: string;
  detail: DetailEtat;
  replie: boolean;
}

interface Bloc {
  id: string;
  nom: string;
  lignes: LigneCalculee[];
}

/** Créneau où le serveur signale le livreur prévu mais pas en service. */
function prevusAuCreneau(tableau: TableauLivraison | undefined): Map<string, 'MORNING' | 'EVENING'> {
  const prevus = new Map<string, 'MORNING' | 'EVENING'>();
  for (const s of tableau?.signaux ?? []) {
    if (s.cle === 'PREVU_PAS_EN_SERVICE' && s.livreur) prevus.set(s.livreur.id, s.creneau ?? 'MORNING');
  }
  return prevus;
}

function Squelette() {
  return (
    <div className="rounded-xl border border-[#F4F4F5] bg-white">
      <div className="h-11 px-3 py-3">
        <div className="h-4 w-48 animate-pulse rounded-full bg-[#F4F4F5]" />
      </div>
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex h-14 items-center gap-3 border-t border-[#F4F4F5] px-3">
          <div className="h-9 w-9 animate-pulse rounded-full bg-[#F4F4F5]" />
          <div className="h-3 w-32 animate-pulse rounded-full bg-[#F4F4F5]" />
          <div className="ml-auto h-3 w-40 animate-pulse rounded-full bg-[#F4F4F5]" />
        </div>
      ))}
    </div>
  );
}

export function LivreursDuJour({ restaurantId, recherche = '', onOuvrir }: LivreursDuJourProps) {
  const maintenant = useMaintenant(30_000);
  const [hsOuverts, setHsOuverts] = useState<Record<string, boolean>>({});
  const { data, isPending, isError, refetch, isFetching } = useDelivererLiveLocationsQuery(
    { restaurantId: restaurantId ?? undefined, includeOffline: true, jour: true },
    { refetchInterval: 60_000 },
  );
  const { data: tableau } = useTableauLivraisonQuery();

  const blocs = useMemo<Bloc[]>(() => {
    if (!data) return [];
    const prevus = prevusAuCreneau(tableau);
    const parRestaurant = new Map<string, Bloc>();
    for (const live of data) {
      const nom = nomLivreur(live) ?? 'Livreur';
      if (!correspondALaRecherche(nom, recherche)) continue;
      const affiche = etatLivreurAffiche(live, maintenant);
      const etat = affiche?.etat ?? 'HORS_SERVICE';
      const rang = rangDuLivreur(live, !!restaurantId);
      const prevu = prevus.get(live.id) ?? null;
      const ligne: LigneCalculee = {
        live,
        etat,
        libelleEtat: affiche?.libelle ?? 'Hors service',
        rang,
        nom,
        detail: detailEtatDuJour(
          etat,
          {
            course: live.active_course,
            pause_until: live.disponibilite?.pause_until ?? live.pause_until,
            auto_pause_until: live.disponibilite?.auto_pause_until ?? live.auto_pause_until,
            appli_vue_a: appliVueADe(live),
            rang,
            prevuAuCreneau: prevu,
          },
          maintenant,
        ),
        replie: estReplie(etat, prevu),
      };
      const id = live.restaurant?.id ?? '';
      if (!parRestaurant.has(id)) {
        parRestaurant.set(id, { id, nom: live.restaurant?.name ?? 'Sans restaurant', lignes: [] });
      }
      parRestaurant.get(id)!.lignes.push(ligne);
    }
    // Ordre des restaurants : celui du tableau quand il est là, sinon alphabétique.
    const ordre = new Map((tableau?.restaurants ?? []).map((r, i) => [r.id, i]));
    return [...parRestaurant.values()]
      .map((b) => ({ ...b, lignes: [...b.lignes].sort(comparerLivreursDuJour) }))
      .sort((a, b) => {
        const ia = ordre.get(a.id) ?? Number.MAX_SAFE_INTEGER;
        const ib = ordre.get(b.id) ?? Number.MAX_SAFE_INTEGER;
        return ia !== ib ? ia - ib : a.nom.localeCompare(b.nom, 'fr');
      });
  }, [data, tableau, recherche, restaurantId, maintenant]);

  if (!data) {
    if (isError) {
      return (
        <div className="flex items-center gap-3 text-sm text-red-600">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>Impossible de lire l&apos;état des livreurs.</span>
          <button
            type="button"
            onClick={() => void refetch()}
            disabled={isFetching}
            className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-2 py-1 text-xs font-semibold hover:bg-red-50 disabled:opacity-50"
          >
            <RotateCw className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin' : ''}`} />
            Réessayer
          </button>
        </div>
      );
    }
    return isPending ? <Squelette /> : null;
  }

  if (blocs.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-[#A1A1AA]">{messageAucunLivreur({ restaurantId, recherche })}</p>
    );
  }

  // Serveur plus ancien : ni planning du jour, ni temps en ligne, ni courses du jour.
  const avecJour = data.some((l) => l.creneau_du_jour !== undefined);
  const prevusParRestaurant = new Map((tableau?.restaurants ?? []).map((r) => [r.id, r.livreurs.prevus]));

  return (
    <div>
      {isError && (
        <p className="mb-2 border-l-2 border-red-500 pl-2 text-xs text-red-600">
          Connexion perdue, nouvel essai en cours
        </p>
      )}
      <div
        className={`grid grid-cols-1 gap-4 ${
          restaurantId ? '' : 'min-[1700px]:grid-cols-2 min-[2400px]:grid-cols-3'
        }`}
      >
        {blocs.map((bloc) => {
          const visibles = bloc.lignes.filter((l) => !l.replie);
          const replies = bloc.lignes.filter((l) => l.replie);
          const enService = bloc.lignes.filter((l) => estEnService(l.etat)).length;
          const ouvert = !!hsOuverts[bloc.id];
          const ligne = (l: LigneCalculee) => (
            <LigneLivreurDuJour
              key={l.live.id}
              live={l.live}
              etat={l.etat}
              libelleEtat={l.libelleEtat}
              detail={l.detail}
              planning={planningDuJour(l.live.creneau_du_jour)}
              enLigne={dureeEnLigne(l.live.en_ligne_aujourdhui_s)}
              avecJour={avecJour}
              onOuvrir={onOuvrir}
            />
          );
          return (
            <section key={bloc.id} className="min-w-0 overflow-hidden rounded-xl border border-[#E4E4E7] bg-white">
              <h3 className="truncate px-3 py-3 text-sm font-semibold text-[#18181B]">
                {enTeteRestaurant(bloc.nom, enService, bloc.lignes.length, prevusParRestaurant.get(bloc.id))}
              </h3>
              <div className="overflow-x-auto">
                <div className="min-w-[600px]">
                  <div
                    className={`grid gap-3 border-t border-[#F4F4F5] bg-[#FAFAFA] px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-[#71717A] ${
                      avecJour ? COLONNES_AVEC_JOUR : COLONNES_SANS_JOUR
                    }`}
                  >
                    <span>Livreur</span>
                    <span>État</span>
                    {avecJour && (
                      <>
                        <span>Planning du jour</span>
                        <span>En ligne</span>
                        <span>Courses</span>
                      </>
                    )}
                    <span />
                  </div>
                  {visibles.map(ligne)}
                  {replies.length > 0 && (
                    <>
                      <button
                        type="button"
                        onClick={() => setHsOuverts((o) => ({ ...o, [bloc.id]: !o[bloc.id] }))}
                        className="flex w-full items-center gap-1.5 border-t border-[#F4F4F5] px-3 py-2.5 text-left text-xs font-semibold text-[#71717A] hover:bg-[#FAFAFA]"
                      >
                        {ouvert ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                        Hors service {replies.length}
                      </button>
                      {ouvert && replies.map(ligne)}
                    </>
                  )}
                </div>
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

export default LivreursDuJour;
