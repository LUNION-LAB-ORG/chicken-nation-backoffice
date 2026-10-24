'use client';

import { Check, Hourglass } from 'lucide-react';
import React from 'react';

import { formatImageUrl } from '@/utils/imageHelpers';

import BoutonAppelerLivreur from '../../calls/components/BoutonAppelerLivreur';
import { nomLivreur, sousTitreLivreur } from '../../calls/utils/appel-livreur';
import type { IDelivererLive } from '../types/deliverer-live.type';
import type { EtatDisponibilite } from '../types/livreur.types';
import type { DetailEtat, MorceauPlanning } from '../utils/livreurs-du-jour';
import { PastilleEtat } from './PastilleEtat';

/**
 * Une ligne de la vue Livreurs « Aujourd'hui » (conception du 24/10, 10.2),
 * hauteur fixe : livreur (avatar cerclé de son état, nom, véhicule), état et
 * son détail, planning du jour, temps en ligne, courses terminées, bouton
 * « Appeler » (admin et centre d'appels seulement). Un texte trop long est
 * coupé, le texte entier au survol.
 *
 * Sans les champs du jour (serveur plus ancien), les trois colonnes du jour
 * disparaissent (`avecJour`).
 */

const VEHICULES: Record<string, string> = { MOTO: 'Moto', VELO: 'Vélo', VOITURE: 'Voiture' };

/** Colonnes, les mêmes pour l'en-tête et les lignes. */
export const COLONNES_AVEC_JOUR =
  'grid-cols-[minmax(0,1.1fr)_minmax(0,1.5fr)_minmax(0,1fr)_4.5rem_4rem_2.5rem]';
export const COLONNES_SANS_JOUR = 'grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)_2.5rem]';

export interface LigneLivreurDuJourProps {
  live: IDelivererLive;
  etat: EtatDisponibilite;
  /** Libellé complet de l'état (« En pause jusqu'à 14 h 32 »), au survol de la pastille. */
  libelleEtat: string;
  detail: DetailEtat;
  planning: MorceauPlanning[] | null;
  enLigne: string;
  avecJour: boolean;
  onOuvrir: (livreurId: string) => void;
}

function Planning({ morceaux }: { morceaux: MorceauPlanning[] | null }) {
  if (!morceaux) return <span />;
  const titre = morceaux.map((m) => m.texte).join(' · ');
  return (
    <span className="flex min-w-0 items-center gap-1.5 truncate text-xs text-[#52525B]" title={titre}>
      {morceaux.map((m, i) => (
        <span
          key={m.texte}
          className={`inline-flex shrink-0 items-center gap-0.5 ${m.reponse === 'REFUSED' ? 'font-semibold text-red-600' : ''}`}
        >
          {i > 0 && <span className="mr-1 text-[#D4D4D8]">·</span>}
          {m.texte}
          {m.reponse === 'CONFIRMED' && <Check className="h-3.5 w-3.5 text-green-600" aria-label="Confirmé" />}
          {m.reponse === 'ASSIGNED' && <Hourglass className="h-3 w-3 text-amber-500" aria-label="En attente" />}
        </span>
      ))}
    </span>
  );
}

export function LigneLivreurDuJour({
  live,
  etat,
  libelleEtat,
  detail,
  planning,
  enLigne,
  avecJour,
  onOuvrir,
}: LigneLivreurDuJourProps) {
  const nom = nomLivreur(live) ?? 'Livreur';
  const vehicule = live.type_vehicule ? (VEHICULES[live.type_vehicule] ?? live.type_vehicule) : '';
  const texteDetail = [detail.texte, detail.retard].filter(Boolean).join(' · ');

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onOuvrir(live.id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOuvrir(live.id);
        }
      }}
      className={`grid h-14 cursor-pointer items-center gap-3 border-t border-[#F4F4F5] px-3 transition-colors hover:bg-[#FFF7F2] ${
        avecJour ? COLONNES_AVEC_JOUR : COLONNES_SANS_JOUR
      }`}
    >
      {/* Livreur */}
      <div className="flex min-w-0 items-center gap-2.5">
        <PastilleEtat
          variante="anneau"
          etat={etat}
          title={libelleEtat}
          image={live.image ? formatImageUrl(live.image) : null}
          prenom={live.first_name}
          nom={live.last_name}
          taille={36}
        />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-[#18181B]" title={nom}>
            {nom}
          </p>
          <p className="h-4 truncate text-[11px] text-[#71717A]">{vehicule}</p>
        </div>
      </div>

      {/* État */}
      <div className="min-w-0">
        <PastilleEtat etat={etat} title={libelleEtat} />
        {/* Le retard reste entier en bout de ligne : à 768 px, « +1 h 02 » était coupé
            derrière la référence de la course, coupée à sa place. */}
        <p className="mt-0.5 flex h-4 min-w-0 text-[11px]" title={texteDetail || undefined}>
          {detail.texte && (
            <span className={`truncate ${detail.ambre ? 'font-semibold text-amber-700' : 'text-[#52525B]'}`}>
              {detail.texte}
            </span>
          )}
          {detail.retard && (
            <span className="shrink-0 whitespace-pre font-semibold text-red-600">
              {detail.texte ? ' · ' : ''}
              {detail.retard}
            </span>
          )}
        </p>
      </div>

      {avecJour && (
        <>
          <Planning morceaux={planning} />
          <span className="text-sm tabular-nums text-[#18181B]">{enLigne}</span>
          <span className="text-sm tabular-nums text-[#18181B]">{live.courses_du_jour ?? ''}</span>
        </>
      )}

      <div className="flex justify-end">
        <BoutonAppelerLivreur
          variante="icone"
          delivererId={live.id}
          nom={nom}
          detail={sousTitreLivreur(live.restaurant?.name)}
        />
      </div>
    </div>
  );
}

export default LigneLivreurDuJour;
