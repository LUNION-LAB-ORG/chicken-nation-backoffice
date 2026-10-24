'use client';

import React from 'react';

import { formatImageUrl } from '@/utils/imageHelpers';

import type { LivreurEnDirect } from '../utils/groupes-en-direct';
import { PastilleEtat } from './PastilleEtat';

/**
 * Une ligne de livreur d'En direct (conception du 24/10, 3.1 et 9.3),
 * hauteur fixe de deux lignes :
 *  - L1 : avatar cerclé de la couleur de l'état, nom, pastille d'état, et à
 *    droite l'heure utile (fin de tournée « 13 h 05 », retard « +12 min » en
 *    rouge, arrivée au restaurant « 12 h 38 ») ;
 *  - L2 : le détail (« CRS-… · 2 sur 3 livrées », « 1er de la file »…).
 *
 * Aucun texte ne passe à la ligne : il est coupé, le texte entier au survol.
 * Toucher la ligne choisit le livreur (carte centrée, fenêtre ouverte).
 */

export interface LigneLivreurProps {
  ligne: LivreurEnDirect;
  choisi: boolean;
  onChoisir: (livreurId: string) => void;
}

/** Identifiant de la ligne dans la page, pour la faire défiler jusqu'à elle. */
export const idLigneLivreur = (livreurId: string) => `en-direct-livreur-${livreurId}`;

export function LigneLivreur({ ligne, choisi, onChoisir }: LigneLivreurProps) {
  const { live, nom, etat, libelleEtat, detail, heure } = ligne;

  return (
    <button
      type="button"
      id={idLigneLivreur(ligne.id)}
      onClick={() => onChoisir(ligne.id)}
      aria-pressed={choisi}
      className={`flex h-14 w-full items-center gap-2.5 px-3 text-left transition-colors ${
        choisi ? 'bg-orange-50' : 'hover:bg-[#FAFAFA]'
      }`}
    >
      <PastilleEtat
        variante="anneau"
        etat={etat}
        title={libelleEtat}
        image={live.image ? formatImageUrl(live.image) : null}
        prenom={live.first_name}
        nom={live.last_name}
        taille={36}
      />
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5">
          <span
            className={`min-w-0 truncate text-[13px] font-semibold ${choisi ? 'text-[#F17922]' : 'text-[#18181B]'}`}
            title={nom}
          >
            {nom}
          </span>
          <PastilleEtat etat={etat} title={libelleEtat} />
          {heure && (
            <span
              className={`ml-auto shrink-0 text-xs tabular-nums ${
                heure.retard ? 'font-semibold text-red-600' : 'text-[#52525B]'
              }`}
              title={heure.titre}
            >
              {heure.texte}
            </span>
          )}
        </span>
        <span className="mt-0.5 block h-4 truncate text-[11px] leading-4 text-[#71717A]" title={detail || undefined}>
          {detail}
        </span>
      </span>
    </button>
  );
}

export default LigneLivreur;
