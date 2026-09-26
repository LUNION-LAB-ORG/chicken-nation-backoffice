"use client";

import React from 'react';
import { dateHeureComplete, horodatageBulle } from '../utils/dates-message';

/** Couleur de la bulle qui porte l'heure : le contraste en dépend. */
export type VarianteBulle = 'orange' | 'blanc' | 'alerte';

const COULEUR: Record<VarianteBulle, string> = {
  // Blanc à 85 % : en dessous, l'heure devient illisible sur l'orange #F17922.
  orange: 'text-white/85',
  blanc: 'text-gray-400',
  alerte: 'text-[#8A4B00]/70',
};

interface HeureMessageProps {
  /** Date ISO de création du message. */
  iso: string;
  /** Référence pour « Aujourd'hui » et « Hier ». Rafraîchie à minuit par l'appelant. */
  maintenant?: Date;
  variante: VarianteBulle;
  /**
   * `coin` : en bas à droite de la bulle de texte (la place est réservée par
   * `ReserveHeure` en fin de paragraphe).
   * `pastille` : posée sur une photo, fond sombre pour rester lisible.
   * `ligne` : sur sa propre ligne, sous un lecteur de note vocale.
   */
  position: 'coin' | 'pastille' | 'ligne';
}

/**
 * DATE ET HEURE d'un message, dans CHAQUE bulle : « Aujourd'hui 18:26 »,
 * « Hier 18:26 », « 24/09 18:26 ».
 *
 * Le survol et les lecteurs d'écran donnent la date complète : « samedi 26
 * septembre 2026 à 18:26 ». Toujours à l'heure d'Abidjan.
 */
function HeureMessage({ iso, maintenant, variante, position }: HeureMessageProps) {
  const texte = horodatageBulle(iso, maintenant);
  if (!texte) return null;
  const complete = dateHeureComplete(iso);

  const base = 'text-[11px] leading-none tabular-nums whitespace-nowrap select-none';
  const classes =
    position === 'pastille'
      ? `${base} absolute bottom-1.5 right-2 rounded bg-black/45 px-1.5 py-0.5 text-white`
      : position === 'coin'
        ? `${base} absolute bottom-1.5 right-2.5 ${COULEUR[variante]}`
        : `${base} block px-3 pb-1.5 text-right ${COULEUR[variante]}`;

  return (
    <time dateTime={iso} title={complete} className={classes}>
      {/* Lu à l'écran : la forme courte. Lu par un lecteur d'écran : la date complète. */}
      <span aria-hidden="true">{texte}</span>
      <span className="sr-only">{complete}</span>
    </time>
  );
}

/**
 * Place réservée en fin de paragraphe pour l'heure posée dans le coin : le
 * même texte, invisible, pour que la dernière ligne ne passe jamais dessous,
 * quelle que soit la longueur (« 18:26 » ou « Aujourd'hui 18:26 »).
 */
export function ReserveHeure({ iso, maintenant }: { iso: string; maintenant?: Date }) {
  const texte = horodatageBulle(iso, maintenant);
  if (!texte) return null;
  return (
    <span aria-hidden="true" className="invisible inline-block pl-3 text-[11px] leading-none tabular-nums whitespace-nowrap">
      {texte}
    </span>
  );
}

export default HeureMessage;
