"use client";

import React, { useState } from 'react';
import { Loader2, Trash2 } from 'lucide-react';

/**
 * RETIRER un message envoyé par erreur.
 *
 * Deux temps, délibérément : le premier clic demande, le second agit. Un
 * message retiré l'est pour tout le monde, client compris, et ce n'est pas le
 * genre de geste qu'on veut déclencher en visant mal une icône qui n'apparaît
 * qu'au survol.
 *
 * Le composant ne décide de rien : il s'affiche quand l'appelant l'estime
 * possible, et le serveur refuse ce qui doit l'être. Les deux règles — son
 * propre message, ou celui d'un collègue si l'on est administrateur — vivent
 * là-bas, seul endroit à connaître l'auteur réel.
 */

interface SupprimerMessageProps {
  onSupprimer: () => Promise<unknown>;
  /** Aligne la confirmation du bon côté de la bulle. */
  aDroite?: boolean;
}

function SupprimerMessage({ onSupprimer, aDroite = false }: SupprimerMessageProps) {
  const [aConfirmer, setAConfirmer] = useState(false);
  const [enCours, setEnCours] = useState(false);

  const agir = async () => {
    if (!aConfirmer) {
      setAConfirmer(true);
      return;
    }
    setEnCours(true);
    try {
      await onSupprimer();
    } finally {
      setEnCours(false);
      setAConfirmer(false);
    }
  };

  return (
    <button
      type="button"
      onClick={agir}
      onBlur={() => setAConfirmer(false)}
      disabled={enCours}
      title="Retirer ce message"
      aria-label="Retirer ce message"
      className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[11px] leading-none transition-opacity disabled:opacity-50 cursor-pointer ${
        aConfirmer
          ? 'bg-[#FDECEA] text-[#C0392B] opacity-100'
          : 'text-gray-400 hover:bg-gray-100 hover:text-[#C0392B] opacity-0 group-hover:opacity-100'
      } ${aDroite ? 'order-first' : ''}`}
    >
      {enCours ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
      {aConfirmer && <span className="font-medium">Confirmer&nbsp;?</span>}
    </button>
  );
}

export default SupprimerMessage;
