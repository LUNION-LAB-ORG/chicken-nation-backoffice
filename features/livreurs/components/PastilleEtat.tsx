'use client';

import React, { useState } from 'react';

import { COULEURS_ETAT, NOM_ETAT } from '../utils/disponibilite';
import type { EtatDisponibilite } from '../types/livreur.types';

/**
 * ÉTAT D'UN LIVREUR, UNE SEULE PIÈCE (conception du 24/10, 3.2).
 *
 * Mêmes couleurs et mêmes mots partout (`COULEURS_ETAT`, `NOM_ETAT`) : ligne
 * Livreurs de Commandes, En direct, Livreurs « Aujourd'hui », groupes hors
 * restaurant.
 *
 *  - variante « pastille » (par défaut) : point de couleur et nom de l'état,
 *    sur une ligne ;
 *  - variante « anneau » : l'avatar du livreur (photo, sinon initiales)
 *    cerclé de la couleur de son état.
 */

interface CommunProps {
  etat: EtatDisponibilite;
  /** Explication au survol (raison du serveur, fin de la pause…). */
  title?: string;
  className?: string;
}

interface PastilleProps extends CommunProps {
  variante?: 'pastille';
}

interface AnneauProps extends CommunProps {
  variante: 'anneau';
  /** Photo du livreur ; sans elle, ou si elle ne charge pas, ses initiales. */
  image?: string | null;
  prenom?: string | null;
  nom?: string | null;
  /** Diamètre en pixels, anneau compris (36 par défaut). */
  taille?: number;
}

export type PastilleEtatProps = PastilleProps | AnneauProps;

/** « AK » pour Awa Koné, « ? » sans nom. */
export function initialesLivreur(prenom?: string | null, nom?: string | null): string {
  const p = (prenom ?? '').trim()[0] ?? '';
  const n = (nom ?? '').trim()[0] ?? '';
  return (p + n).toUpperCase() || '?';
}

function Pastille({ etat, title, className = '' }: PastilleProps) {
  const couleurs = COULEURS_ETAT[etat];
  return (
    <span
      title={title ?? NOM_ETAT[etat]}
      className={`inline-flex max-w-full shrink-0 items-center gap-1 whitespace-nowrap rounded-full px-1.5 py-0.5 text-[10px] font-semibold leading-none ${className}`}
      style={{ backgroundColor: couleurs.fond, color: couleurs.texte }}
    >
      <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: couleurs.couleur }} />
      <span className="truncate">{NOM_ETAT[etat]}</span>
    </span>
  );
}

function Anneau({ etat, title, className = '', image, prenom, nom, taille = 36 }: AnneauProps) {
  const [imageCassee, setImageCassee] = useState(false);
  const couleurs = COULEURS_ETAT[etat];
  const initiales = initialesLivreur(prenom, nom);
  const interieur = taille - 4;

  return (
    <span
      title={title ?? NOM_ETAT[etat]}
      className={`inline-flex shrink-0 items-center justify-center rounded-full ${className}`}
      style={{ width: taille, height: taille, backgroundColor: couleurs.couleur }}
    >
      {image && !imageCassee ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={image}
          alt={initiales}
          width={interieur}
          height={interieur}
          className="rounded-full border-2 border-white object-cover"
          style={{ width: interieur, height: interieur }}
          onError={() => setImageCassee(true)}
        />
      ) : (
        <span
          className="flex items-center justify-center rounded-full border-2 border-white text-[11px] font-bold"
          style={{ width: interieur, height: interieur, backgroundColor: couleurs.fond, color: couleurs.texte }}
        >
          {initiales}
        </span>
      )}
    </span>
  );
}

export function PastilleEtat(props: PastilleEtatProps) {
  if (props.variante === 'anneau') return <Anneau {...props} />;
  return <Pastille {...props} />;
}

export default PastilleEtat;
