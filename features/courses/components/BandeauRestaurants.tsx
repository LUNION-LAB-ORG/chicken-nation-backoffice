'use client';

import { AlertTriangle, ChevronDown, ChevronUp, RotateCw } from 'lucide-react';
import React, { useState } from 'react';

import { useDashboardStore } from '@/store/dashboardStore';

import { useDroitsLivraison } from '../../livreurs/hook/use-droits-livraison';
import { useMaintenant } from '../../livreurs/hook/use-maintenant';
import { estCompteDeRestaurant } from '../../operations/utils/code-retrait';
import BoutonAppelerLivreur from '../../calls/components/BoutonAppelerLivreur';
import { BoutonDebloquer } from '../../livreurs/components/BoutonDebloquer';
import { FicheLivreurRapide } from '../../livreurs/components/FicheLivreurRapide';
import { PastilleEtat } from '../../livreurs/components/PastilleEtat';
import RestaurantTabs from '../../orders/components/filtrage/RestaurantTabs';
import { nomCourtRestaurant } from '../../restaurants/utils/nom-court';
import { useAuthStore } from '../../users/hook/authStore';
import { useTableauLivraisonQuery } from '../queries/tableau-livraison.query';
import type { RestaurantDuTableau, SignalLivraison } from '../types/tableau-livraison.types';
import {
  NOM_TOUS_LES_RESTAURANTS,
  affichageBandeau,
  detailDuLivreurDuChiffre,
  dureeLisible,
  etatAffichable,
  livreursDuChiffre,
  titreListeChiffre,
  type GroupeChiffre,
  type LivreurDuChiffre,
  libelleAlertes,
  lignesPiedCarte,
  minutesDepuis,
  motsDesChiffres,
  peutLireTableau,
  tonSansLivreur,
  totalDuReseau,
  type TonSansLivreur,
} from '../utils/tableau-livraison';

/**
 * BANDEAU DES RESTAURANTS (conception du 24/10, section 8 ; compact depuis le
 * 10/11), commun aux écrans Carte live, Courses, Livreurs et Planning.
 *
 * Avant : une grande carte par restaurant, répétée en haut des quatre écrans,
 * aux mots coupés (« Disponibl… En cour… »). Maintenant :
 *
 *  - compte du siège : une rangée de boutons « Tous », « ANGRE 6 »,
 *    « FAYA 4 »… (nom court, alertes rouges), qui sert de filtre, le même que
 *    l'écran Commandes (`selectedRestaurantId` du tableau de bord) ;
 *  - puis UNE ligne de chiffres, en mots entiers, pour le choix en cours :
 *    disponibles, en course, en pause, non assignées (depuis combien de
 *    temps), livrées et durée moyenne, en service sur les prévus ;
 *  - compte de restaurant : la ligne de son restaurant seulement.
 *
 * « disponibles », « en course », « en pause » se déplient (10/11 : voir les
 * livreurs d'un état sans quitter la page) : la liste s'ouvre sous la ligne,
 * un second clic (ou « Replier ») la referme. Le nom ouvre la fiche rapide
 * (numéro pour l'appeler hors de l'appli) ; « Débloquer » et l'appel dans
 * l'appli à côté.
 *
 * Serveur sans la route (404), ou activité illisible sans donnée en cache :
 * les onglets des restaurants (`RestaurantTabs`) gardent le filtre.
 */

export interface BandeauRestaurantsProps {
  className?: string;
}

const COULEURS_TON: Record<TonSansLivreur, string> = {
  aucun: '#71717A',
  ambre: '#B45309',
  rouge: '#B91C1C',
};

function Puce({
  nom,
  titre,
  alertes,
  choisie,
  onChoisir,
}: {
  nom: string;
  titre: string;
  alertes: number;
  choisie: boolean;
  onChoisir: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onChoisir}
      aria-pressed={choisie}
      title={titre}
      className={`inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg border px-3 text-sm font-semibold transition-colors ${
        choisie
          ? 'border-[#F17922] bg-[#F17922] text-white'
          : 'border-[#E4E4E7] bg-white text-[#18181B] hover:border-[#F17922]/50'
      }`}
    >
      {nom}
      {alertes > 0 && (
        <span
          className={`rounded-full px-1.5 py-0.5 text-[11px] font-semibold leading-none ${
            choisie ? 'bg-white text-red-700' : 'bg-red-100 text-red-700'
          }`}
          aria-label={libelleAlertes(alertes) ?? undefined}
        >
          {alertes}
        </span>
      )}
    </button>
  );
}

function Chiffre({
  valeur,
  mot,
  couleur,
  sous,
  ouvert,
  onBasculer,
}: {
  valeur: number;
  mot: string;
  couleur: string;
  sous?: string | null;
  /** Chiffre qui se déplie : sa liste est-elle ouverte ? */
  ouvert?: boolean;
  onBasculer?: () => void;
}) {
  if (onBasculer) {
    return (
      <button
        type="button"
        onClick={onBasculer}
        aria-expanded={!!ouvert}
        title={ouvert ? 'Replier la liste' : 'Voir ces livreurs'}
        className={`-mx-1.5 inline-flex items-center gap-1 whitespace-nowrap rounded-md px-1.5 py-0.5 transition-colors ${
          ouvert ? 'bg-orange-50 ring-1 ring-[#F17922]/40' : 'hover:bg-[#F4F4F5]'
        }`}
      >
        <span className="font-bold" style={{ color: couleur }}>
          {valeur}
        </span>
        <span className="text-[#52525B]">{mot}</span>
        <ChevronDown className={`h-3 w-3 text-[#A1A1AA] transition-transform ${ouvert ? 'rotate-180' : ''}`} />
      </button>
    );
  }
  return (
    <span className="whitespace-nowrap">
      <span className="font-bold" style={{ color: couleur }}>
        {valeur}
      </span>{' '}
      <span className="text-[#52525B]">{mot}</span>
      {sous && (
        <span className="text-xs" style={{ color: couleur }}>
          {' '}
          {sous}
        </span>
      )}
    </span>
  );
}

/** La ligne de chiffres du restaurant choisi (ou de tout le réseau). */
function LigneChiffres({
  r,
  signaux,
  restaurantId,
  maintenant,
  nom,
  ouvert,
  onBasculer,
}: {
  r: RestaurantDuTableau;
  signaux: readonly SignalLivraison[];
  /** null : tout le réseau. */
  restaurantId: string | null;
  maintenant: Date;
  /** Compte de restaurant : son nom en tête. */
  nom?: string | null;
  ouvert: GroupeChiffre | null;
  onBasculer: (groupe: GroupeChiffre) => void;
}) {
  const mots = motsDesChiffres(r);
  const ton = tonSansLivreur(r, signaux, restaurantId);
  const attente =
    r.sans_livreur.courses > 0 ? minutesDepuis(r.sans_livreur.plus_ancienne_depuis, maintenant) : null;
  const { activite, service } = lignesPiedCarte(r);
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-xl border border-[#E4E4E7] bg-white px-3 py-2 text-sm">
      {nom && <span className="font-semibold text-[#18181B]">{nom}</span>}
      <Chiffre
        valeur={r.livreurs.disponibles}
        mot={mots.disponibles}
        couleur={r.livreurs.disponibles > 0 ? '#166534' : '#B91C1C'}
        ouvert={ouvert === 'DISPONIBLES'}
        onBasculer={() => onBasculer('DISPONIBLES')}
      />
      <Chiffre
        valeur={r.livreurs.en_course}
        mot={mots.enCourse}
        couleur="#1E40AF"
        ouvert={ouvert === 'EN_COURSE'}
        onBasculer={() => onBasculer('EN_COURSE')}
      />
      <Chiffre
        valeur={r.livreurs.en_pause}
        mot={mots.enPause}
        couleur="#92400E"
        ouvert={ouvert === 'EN_PAUSE'}
        onBasculer={() => onBasculer('EN_PAUSE')}
      />
      <Chiffre
        valeur={r.sans_livreur.courses}
        mot={mots.nonAssignees}
        couleur={COULEURS_TON[ton]}
        sous={attente !== null ? `depuis ${dureeLisible(attente)}` : null}
      />
      <span className="whitespace-nowrap text-[#52525B]">{activite}</span>
      {service && <span className="whitespace-nowrap text-[#52525B]">{service}</span>}
    </div>
  );
}

/** Les livreurs d'un chiffre, dépliés sous la ligne. */
function ListeDuChiffre({
  restaurants,
  restaurantId,
  groupe,
  onFermer,
}: {
  restaurants: readonly RestaurantDuTableau[];
  restaurantId: string | null;
  groupe: GroupeChiffre;
  onFermer: () => void;
}) {
  const [fiche, setFiche] = useState<LivreurDuChiffre | null>(null);
  const livreurs = livreursDuChiffre(restaurants, restaurantId, groupe);
  const avecRestaurant = !restaurantId && restaurants.length > 1;
  return (
    <div className="rounded-xl border border-[#E4E4E7] bg-white p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-[#18181B]">{titreListeChiffre(groupe, livreurs.length)}</p>
        <button
          type="button"
          onClick={onFermer}
          className="inline-flex h-7 items-center gap-1 rounded-lg px-2 text-xs font-semibold text-[#71717A] hover:bg-[#F4F4F5] hover:text-[#18181B]"
        >
          Replier
          <ChevronUp className="h-3.5 w-3.5" />
        </button>
      </div>
      {livreurs.length > 0 && (
        <ul className="mt-2 grid max-h-72 gap-2 overflow-y-auto pr-0.5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {livreurs.map((l) => {
            const nom = [l.prenom, l.nom].filter((x) => !!x && x.trim()).join(' ') || 'Livreur';
            const etat = etatAffichable(l.etat);
            const ligne = [avecRestaurant ? (nomCourtRestaurant(l.restaurant.nom) ?? l.restaurant.nom) : null, detailDuLivreurDuChiffre(l)]
              .filter(Boolean)
              .join(' · ');
            return (
              <li key={l.id} className="flex items-center gap-2.5 rounded-lg border border-[#F4F4F5] px-2.5 py-2">
                <PastilleEtat variante="anneau" etat={etat} prenom={l.prenom} nom={l.nom} taille={32} />
                <button
                  type="button"
                  onClick={() => setFiche(l)}
                  title="Numéro et gestes du livreur"
                  className="group/livreur min-w-0 flex-1 text-left"
                >
                  <span className="block truncate text-sm font-semibold text-[#18181B] underline-offset-2 group-hover/livreur:underline">
                    {nom}
                  </span>
                  <span className="block truncate text-[11px] text-[#71717A]">{ligne}</span>
                </button>
                {etat === 'PAUSE_AUTO' && <BoutonDebloquer livreurId={l.id} />}
                <BoutonAppelerLivreur variante="icone" delivererId={l.id} nom={nom} detail={l.restaurant.nom} />
              </li>
            );
          })}
        </ul>
      )}
      {fiche && (
        <FicheLivreurRapide
          livreur={{ id: fiche.id, prenom: fiche.prenom, nom: fiche.nom ?? null, telephone: fiche.telephone ?? null }}
          contexte={nomCourtRestaurant(fiche.restaurant.nom) ?? fiche.restaurant.nom}
          onFermer={() => setFiche(null)}
        />
      )}
    </div>
  );
}

function Squelettes() {
  return (
    <div aria-hidden className="space-y-2">
      <div className="flex gap-2">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-9 w-24 animate-pulse rounded-lg bg-[#F4F4F5]" />
        ))}
      </div>
      <div className="h-10 animate-pulse rounded-xl bg-[#F4F4F5]" />
    </div>
  );
}

export function BandeauRestaurants({ className = '' }: BandeauRestaurantsProps) {
  const membre = useAuthStore((s) => s.user);
  const compteDeRestaurant = estCompteDeRestaurant(membre);
  const { voirLivraison } = useDroitsLivraison();
  const selectedRestaurantId = useDashboardStore((s) => s.selectedRestaurantId);
  const setSelectedRestaurantId = useDashboardStore((s) => s.setSelectedRestaurantId);
  const maintenant = useMaintenant(30_000);
  // Chiffre déplié (« 16 en pause ») : sa liste sous la ligne, un seul à la fois.
  const [ouvert, setOuvert] = useState<GroupeChiffre | null>(null);
  const basculer = (g: GroupeChiffre) => setOuvert((o) => (o === g ? null : g));
  // Le guetteur global relit pour l'admin et le suivi des livraisons ; le
  // bandeau relit lui-même pour un compte de restaurant.
  const { data, error, isPending, isError, refetch, isFetching } = useTableauLivraisonQuery({
    pilote: !voirLivraison,
  });

  const affichage = affichageBandeau({
    compteDeRestaurant,
    peutLire: peutLireTableau(membre),
    erreur: error,
    aDesDonnees: !!data,
    enErreur: isError,
    enChargement: isPending,
  });

  // Serveur sans la route, ou compte qu'elle refuserait : les onglets gardent le filtre.
  if (affichage === 'onglets') return <RestaurantTabs showAllTab />;
  if (affichage === 'rien') return null;

  const rangee = (contenu: React.ReactNode) => (
    <div className={`space-y-2 ${className}`}>
      {isError && data && (
        <p className="border-l-2 border-red-500 pl-2 text-xs text-red-600">Connexion perdue, nouvel essai en cours</p>
      )}
      {contenu}
    </div>
  );

  if (!data) {
    if (affichage === 'squelettes') return rangee(<Squelettes />);
    // Siège : les onglets gardent le choix du restaurant, qui filtre encore l'écran.
    return (
      <div className={className}>
        <div className="flex items-center gap-3 text-sm text-red-600">
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
        {affichage === 'erreur_et_onglets' && (
          <div className="mt-3">
            <RestaurantTabs showAllTab />
          </div>
        )}
      </div>
    );
  }

  const restaurants = compteDeRestaurant
    ? data.restaurants.filter((r) => !membre?.restaurant_id || r.id === membre.restaurant_id)
    : data.restaurants;

  if (restaurants.length === 0) {
    return <p className={`text-sm text-[#A1A1AA] ${className}`}>Aucun restaurant.</p>;
  }

  if (compteDeRestaurant) {
    return rangee(
      <>
        {restaurants.map((r) => (
          <LigneChiffres
            key={r.id}
            r={r}
            signaux={data.signaux}
            restaurantId={r.id}
            maintenant={maintenant}
            nom={nomCourtRestaurant(r.nom) ?? r.nom}
            ouvert={ouvert}
            onBasculer={basculer}
          />
        ))}
        {ouvert && (
          <ListeDuChiffre restaurants={restaurants} restaurantId={null} groupe={ouvert} onFermer={() => setOuvert(null)} />
        )}
      </>,
    );
  }

  const choisi = selectedRestaurantId ? (restaurants.find((r) => r.id === selectedRestaurantId) ?? null) : null;
  const total = totalDuReseau(restaurants);
  return rangee(
    <>
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-[#E4E4E7] scrollbar-track-transparent">
        <Puce
          nom="Tous"
          titre={NOM_TOUS_LES_RESTAURANTS}
          alertes={total.alertes}
          choisie={!selectedRestaurantId}
          onChoisir={() => setSelectedRestaurantId(null)}
        />
        {restaurants.map((r) => (
          <Puce
            key={r.id}
            nom={nomCourtRestaurant(r.nom) ?? r.nom}
            titre={r.nom}
            alertes={r.alertes}
            choisie={choisi?.id === r.id}
            onChoisir={() => setSelectedRestaurantId(r.id)}
          />
        ))}
      </div>
      <LigneChiffres
        r={choisi ?? total}
        signaux={data.signaux}
        restaurantId={choisi?.id ?? null}
        maintenant={maintenant}
        ouvert={ouvert}
        onBasculer={basculer}
      />
      {ouvert && (
        <ListeDuChiffre
          restaurants={restaurants}
          restaurantId={choisi?.id ?? null}
          groupe={ouvert}
          onFermer={() => setOuvert(null)}
        />
      )}
    </>,
  );
}

export default BandeauRestaurants;
