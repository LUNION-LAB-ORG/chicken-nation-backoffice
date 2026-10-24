'use client';

import React from 'react';

import { useDashboardStore } from '@/store/dashboardStore';

import { useTableauLivraisonQuery } from '../../courses/queries/tableau-livraison.query';
import { useDroitsLivraison } from '../../livreurs/hook/use-droits-livraison';
import { COULEURS_ETAT } from '../../livreurs/utils/disponibilite';
import { useAuthStore } from '../../users/hook/authStore';
import { AUCUN_LIVREUR_EN_SERVICE, pastillesLivreurs, restaurantDeLaLigne } from '../utils/ligne-livreurs';

/**
 * LIGNE LIVREURS de l'écran Commandes, onglet « En cours » (conception du
 * 24/10, 6.2), à la place de la barre des quatre compteurs.
 *
 * « Livreurs ● Koffi au restaurant ● Awa en livraison ● Yao 1er de la file »,
 * une ligne qui défile sur petit écran.
 *
 * Visible quand un seul restaurant est affiché (compte de restaurant, ou
 * compte du siège qui en a choisi un) et que `GET /livraison/tableau`
 * répond ; rien sur « Tous », pendant le chargement, en erreur, ni avec un
 * serveur qui n'a pas la route : elle ne bloque jamais l'écran. Pas pour le
 * centre d'appels ni la cuisine (le serveur leur refuse le tableau).
 *
 * Toucher une pastille ouvre En direct sur ce livreur pour qui voit la
 * livraison, sinon rien.
 */

export interface LigneLivreursProps {
  /**
   * Restaurant choisi par un compte du siège ; par défaut celui du tableau de
   * bord (`selectedRestaurantId`). Un compte de restaurant voit toujours le sien.
   */
  restaurantChoisi?: string | null;
  /** Toucher une pastille ; par défaut, ouvre En direct sur ce livreur (`openEnDirect`) si le compte voit la livraison. */
  onChoisirLivreur?: (livreurId: string) => void;
  className?: string;
}

export function LigneLivreurs({ restaurantChoisi, onChoisirLivreur, className = '' }: LigneLivreursProps) {
  const membre = useAuthStore((s) => s.user);
  const restaurantDuTableauDeBord = useDashboardStore((s) => s.selectedRestaurantId);
  const openEnDirect = useDashboardStore((s) => s.openEnDirect);
  const { voirLivraison } = useDroitsLivraison();

  const restaurantId = restaurantDeLaLigne(
    membre,
    restaurantChoisi !== undefined ? restaurantChoisi : restaurantDuTableauDeBord,
  );
  // Pour l'admin et le suivi des livraisons, le guetteur global relit déjà.
  const { data, isError } = useTableauLivraisonQuery({ pilote: !voirLivraison, actif: !!restaurantId });

  if (!restaurantId || !data || isError) return null;
  const restaurant = data.restaurants.find((r) => r.id === restaurantId);
  if (!restaurant) return null;

  const pastilles = pastillesLivreurs(restaurant.liste);
  const choisir = onChoisirLivreur ?? (voirLivraison ? openEnDirect : null);

  return (
    <div
      className={`flex min-h-8 items-center gap-2 overflow-x-auto whitespace-nowrap scrollbar-thin scrollbar-thumb-[#E4E4E7] scrollbar-track-transparent ${className}`}
    >
      <span className="shrink-0 text-sm font-semibold text-[#18181B]">Livreurs</span>
      {pastilles.length === 0 ? (
        <span className="text-sm font-medium text-red-600">{AUCUN_LIVREUR_EN_SERVICE}</span>
      ) : (
        pastilles.map((p) => {
          const couleurs = COULEURS_ETAT[p.etat];
          const style = { backgroundColor: couleurs.fond, color: couleurs.texte };
          const interieur = (
            <>
              <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: couleurs.couleur }} />
              <span>{p.texte}</span>
            </>
          );
          const classes =
            'inline-flex h-7 shrink-0 items-center gap-1.5 rounded-full px-2.5 text-xs font-semibold leading-none';
          return choisir ? (
            <button
              key={p.id}
              type="button"
              onClick={() => choisir(p.id)}
              className={`${classes} cursor-pointer transition-opacity hover:opacity-80`}
              style={style}
            >
              {interieur}
            </button>
          ) : (
            <span key={p.id} className={classes} style={style}>
              {interieur}
            </span>
          );
        })
      )}
    </div>
  );
}

export default LigneLivreurs;
