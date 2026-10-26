'use client';

import React from 'react';
import { PowerOff, Smartphone, WifiOff, type LucideIcon } from 'lucide-react';

import { COULEURS_PRESENCE, libellePresence, type CasAppli, type PresenceAppli } from '../utils/disponibilite';

/** Pictogramme de chaque cas : appli fermée, connexion coupée, en arrière-plan, sans connexion (serveur ancien). */
export const ICONE_PRESENCE: Record<CasAppli, LucideIcon> = {
  FERMEE: PowerOff,
  COUPURE: WifiOff,
  ARRIERE_PLAN: Smartphone,
  NON_CONNECTEE: WifiOff,
};

interface Props {
  presence: PresenceAppli;
  /**
   * Le badge d'état dit déjà « Appli fermée » ou « Connexion coupée » :
   * seule l'heure du dernier signal est ajoutée (« vue il y a 6 min »,
   * « depuis 4 min »).
   */
  sansLibelle?: boolean;
  /** Texte plus petit (colonne d'une liste). */
  petit?: boolean;
  className?: string;
}

/**
 * Une ligne sous le nom d'un livreur : « Appli fermée · vue il y a 6 min »
 * (gris), « Connexion coupée · depuis 4 min » (ambre), « En arrière-plan »
 * (offres par notification), « Appli non connectée ». L'explication est
 * dans l'infobulle.
 */
export function PresenceAppliLigne({ presence, sansLibelle = false, petit = false, className = '' }: Props) {
  const texte = sansLibelle ? presence.vue : libellePresence(presence);
  if (!texte) return null;
  const Icone = ICONE_PRESENCE[presence.cas];
  return (
    <div
      className={`flex items-center gap-1 font-semibold ${petit ? 'text-[10px]' : 'text-[11px]'} ${className}`}
      style={{ color: COULEURS_PRESENCE[presence.cas].texte }}
      title={presence.raison}
    >
      <Icone className="w-3 h-3 shrink-0" aria-hidden />
      <span className="truncate">{texte}</span>
    </div>
  );
}
