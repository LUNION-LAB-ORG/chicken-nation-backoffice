'use client';

import { LockOpen } from 'lucide-react';
import React from 'react';

import { useDroitsLivraison } from '../hook/use-droits-livraison';
import { useDebloquerLivreurMutation } from '../queries/debloquer-livreur.mutation';

/**
 * « Débloquer » (demande du 10/11) : à côté d'un livreur en pause
 * automatique (refus répétés), pour qui pilote les courses (administrateur,
 * centre d'appels), comme le serveur. Un toucher, sans question : le geste
 * ne fait que rendre au livreur les courses qu'il recevait avant. Le clic ne
 * remonte pas à la ligne (qui ouvre la fiche ou choisit le livreur).
 *
 * Rien pour un autre compte : le livreur attend la fin de sa pause.
 */
export function BoutonDebloquer({ livreurId, className = '' }: { livreurId: string; className?: string }) {
  const { piloterCourses } = useDroitsLivraison();
  const { mutate, isPending } = useDebloquerLivreurMutation();
  if (!piloterCourses) return null;
  return (
    <button
      type="button"
      disabled={isPending}
      onClick={(e) => {
        e.stopPropagation();
        mutate(livreurId);
      }}
      onKeyDown={(e) => e.stopPropagation()}
      className={`inline-flex h-7 shrink-0 items-center gap-1 rounded-lg bg-[#F17922] px-2 text-[11px] font-semibold text-white transition hover:opacity-90 disabled:opacity-60 ${className}`}
    >
      <LockOpen className={`h-3.5 w-3.5 ${isPending ? 'animate-pulse' : ''}`} />
      {isPending ? 'Envoi…' : 'Débloquer'}
    </button>
  );
}

export default BoutonDebloquer;
