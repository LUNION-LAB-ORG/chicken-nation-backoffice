'use client';

import { AlertTriangle, RotateCw } from 'lucide-react';
import React from 'react';

import { useDashboardStore } from '@/store/dashboardStore';

import { useDroitsLivraison } from '../../livreurs/hook/use-droits-livraison';
import { useMaintenant } from '../../livreurs/hook/use-maintenant';
import { estCompteDeRestaurant } from '../../operations/utils/code-retrait';
import RestaurantTabs from '../../orders/components/filtrage/RestaurantTabs';
import { useAuthStore } from '../../users/hook/authStore';
import { useTableauLivraisonQuery } from '../queries/tableau-livraison.query';
import type { RestaurantDuTableau, SignalLivraison } from '../types/tableau-livraison.types';
import {
  dureeLisible,
  estRouteAbsente,
  libelleAlertes,
  lignesPiedCarte,
  minutesDepuis,
  peutLireTableau,
  piedCarte,
  tonSansLivreur,
  totalDuReseau,
  type TonSansLivreur,
} from '../utils/tableau-livraison';

/**
 * BANDEAU DES RESTAURANTS (conception du 24/10, section 8), commun aux
 * écrans En direct, Courses, Livreurs et Planning.
 *
 * Une carte par restaurant : livreurs disponibles, en course, en pause,
 * courses sans livreur, et la journée (livrées, durée moyenne, livreurs en
 * service sur les prévus du planning).
 *
 *  - compte du siège : la rangée sert de filtre, le même que l'écran
 *    Commandes (`selectedRestaurantId` du tableau de bord) ; carte choisie
 *    bordée d'orange, les autres restent visibles ; « Tous les restaurants »
 *    en tête ;
 *  - compte de restaurant : sa seule carte, qu'on ne touche pas.
 *
 * Serveur sans la route (404) : les onglets des restaurants
 * (`RestaurantTabs`) gardent le filtre.
 */

export interface BandeauRestaurantsProps {
  className?: string;
}

const COULEURS_TON: Record<TonSansLivreur, string> = {
  aucun: '#71717A',
  ambre: '#B45309',
  rouge: '#B91C1C',
};

// 136 px : le pied tient sur deux lignes (sur une seule, sa fin était coupée).
const CARTE = 'h-[136px] w-[260px] shrink-0 rounded-xl border bg-white p-3 text-left';

function Chiffre({
  valeur,
  libelle,
  couleur,
  sous,
}: {
  valeur: number;
  libelle: string;
  couleur: string;
  sous?: string | null;
}) {
  return (
    <div className="min-w-0">
      <p className="text-lg font-bold leading-6" style={{ color: couleur }}>
        {valeur}
      </p>
      <p className="truncate text-[10px] leading-3 text-[#71717A]" title={libelle}>
        {libelle}
      </p>
      <p className="h-3 truncate text-[10px] leading-3" style={{ color: couleur }}>
        {sous ?? ''}
      </p>
    </div>
  );
}

function CarteRestaurant({
  r,
  signaux,
  restaurantId,
  choisie,
  onChoisir,
  maintenant,
}: {
  r: RestaurantDuTableau;
  signaux: readonly SignalLivraison[];
  /** null : carte « Tous les restaurants ». */
  restaurantId: string | null;
  choisie: boolean;
  onChoisir?: () => void;
  maintenant: Date;
}) {
  const alertes = libelleAlertes(r.alertes);
  const ton = tonSansLivreur(r, signaux, restaurantId);
  const attente =
    r.sans_livreur.courses > 0 ? minutesDepuis(r.sans_livreur.plus_ancienne_depuis, maintenant) : null;
  const pied = piedCarte(r);
  const { activite, service } = lignesPiedCarte(r);
  const nom = r.nom;

  const contenu = (
    <>
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-sm font-semibold text-[#18181B]" title={r.nom}>
          {nom}
        </span>
        {alertes && (
          <span className="shrink-0 rounded-full bg-red-100 px-1.5 py-0.5 text-[10px] font-semibold leading-none text-red-700">
            {alertes}
          </span>
        )}
      </div>
      <div className="mt-1.5 flex justify-between gap-1.5">
        <Chiffre
          valeur={r.livreurs.disponibles}
          libelle="Disponibles"
          couleur={r.livreurs.disponibles > 0 ? '#166534' : '#B91C1C'}
        />
        <Chiffre valeur={r.livreurs.en_course} libelle="En course" couleur="#1E40AF" />
        <Chiffre valeur={r.livreurs.en_pause} libelle="En pause" couleur="#92400E" />
        <Chiffre
          valeur={r.sans_livreur.courses}
          libelle="Non assignées"
          couleur={COULEURS_TON[ton]}
          sous={attente !== null ? `depuis ${dureeLisible(attente)}` : null}
        />
      </div>
      <div className="mt-1.5 text-[11px] leading-4 text-[#52525B]" title={pied}>
        <p className="truncate">{activite}</p>
        <p className="h-4 truncate">{service ?? ''}</p>
      </div>
    </>
  );

  if (!onChoisir) {
    return <div className={`${CARTE} border-[#E4E4E7]`}>{contenu}</div>;
  }
  return (
    <button
      type="button"
      onClick={onChoisir}
      aria-pressed={choisie}
      className={`${CARTE} cursor-pointer transition-colors ${
        choisie ? 'border-[#F17922] ring-1 ring-[#F17922]' : 'border-[#E4E4E7] hover:border-[#F17922]/50'
      }`}
    >
      {contenu}
    </button>
  );
}

function Squelettes() {
  return (
    <>
      {[0, 1, 2].map((i) => (
        <div key={i} className={`${CARTE} animate-pulse border-[#F4F4F5]`}>
          <div className="h-3.5 w-24 rounded-full bg-[#F4F4F5]" />
          <div className="mt-3 grid grid-cols-4 gap-2">
            {[0, 1, 2, 3].map((j) => (
              <div key={j} className="h-9 rounded-md bg-[#F4F4F5]" />
            ))}
          </div>
          <div className="mt-3 h-3 w-40 rounded-full bg-[#F4F4F5]" />
          <div className="mt-1.5 h-3 w-32 rounded-full bg-[#F4F4F5]" />
        </div>
      ))}
    </>
  );
}

export function BandeauRestaurants({ className = '' }: BandeauRestaurantsProps) {
  const membre = useAuthStore((s) => s.user);
  const compteDeRestaurant = estCompteDeRestaurant(membre);
  const { voirLivraison } = useDroitsLivraison();
  const selectedRestaurantId = useDashboardStore((s) => s.selectedRestaurantId);
  const setSelectedRestaurantId = useDashboardStore((s) => s.setSelectedRestaurantId);
  const maintenant = useMaintenant(30_000);
  // Le guetteur global relit pour l'admin et le suivi des livraisons ; le
  // bandeau relit lui-même pour un compte de restaurant.
  const { data, error, isPending, isError, refetch, isFetching } = useTableauLivraisonQuery({
    pilote: !voirLivraison,
  });

  // Serveur sans la route, ou compte qu'elle refuserait : les onglets gardent le filtre.
  if (!peutLireTableau(membre) || estRouteAbsente(error)) {
    return compteDeRestaurant ? null : <RestaurantTabs showAllTab />;
  }

  const rangee = (contenu: React.ReactNode) => (
    <div className={className}>
      {isError && data && (
        <p className="mb-2 border-l-2 border-red-500 pl-2 text-xs text-red-600">
          Connexion perdue, nouvel essai en cours
        </p>
      )}
      <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-[#E4E4E7] scrollbar-track-transparent">
        {contenu}
      </div>
    </div>
  );

  if (!data) {
    if (isError) {
      return (
        <div className={`flex items-center gap-3 text-sm text-red-600 ${className}`}>
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>Impossible de lire l&apos;activité des restaurants.</span>
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
    return isPending ? rangee(<Squelettes />) : null;
  }

  const restaurants = compteDeRestaurant
    ? data.restaurants.filter((r) => !membre?.restaurant_id || r.id === membre.restaurant_id)
    : data.restaurants;

  if (restaurants.length === 0) {
    return <p className={`text-sm text-[#A1A1AA] ${className}`}>Aucun restaurant.</p>;
  }

  if (compteDeRestaurant) {
    return rangee(
      restaurants.map((r) => (
        <CarteRestaurant
          key={r.id}
          r={r}
          signaux={data.signaux}
          restaurantId={r.id}
          choisie={false}
          maintenant={maintenant}
        />
      )),
    );
  }

  return rangee(
    <>
      <CarteRestaurant
        r={totalDuReseau(restaurants)}
        signaux={data.signaux}
        restaurantId={null}
        choisie={!selectedRestaurantId}
        onChoisir={() => setSelectedRestaurantId(null)}
        maintenant={maintenant}
      />
      {restaurants.map((r) => (
        <CarteRestaurant
          key={r.id}
          r={r}
          signaux={data.signaux}
          restaurantId={r.id}
          choisie={selectedRestaurantId === r.id}
          onChoisir={() => setSelectedRestaurantId(r.id)}
          maintenant={maintenant}
        />
      ))}
    </>,
  );
}

export default BandeauRestaurants;
