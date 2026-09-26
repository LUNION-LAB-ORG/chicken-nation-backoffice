"use client";

import React from 'react';
import { AlertTriangle, ImageIcon, Mic } from 'lucide-react';
import type { ICitationMessage } from '../types/conversation.type';
import { nomAuteurCitation, texteCitation } from '../utils/citation-locale';
import type { VarianteBulle } from './HeureMessage';

const STYLE: Record<VarianteBulle, { cadre: string; nom: string; texte: string }> = {
  orange: {
    cadre: 'bg-white/15 border-white/70 hover:bg-white/25',
    nom: 'text-white',
    texte: 'text-white/90',
  },
  blanc: {
    cadre: 'bg-orange-50 border-[#F17922] hover:bg-orange-100/70',
    nom: 'text-[#C25E0F]',
    texte: 'text-gray-600',
  },
  alerte: {
    cadre: 'bg-[#F8E3C8]/70 border-[#D98B2B] hover:bg-[#F8E3C8]',
    nom: 'text-[#8A4B00]',
    texte: 'text-[#8A4B00]/80',
  },
};

interface CitationMessageProps {
  citation: ICitationMessage;
  moiId?: string | null;
  variante: VarianteBulle;
  /** Clic : défiler jusqu'au message d'origine et le surligner. */
  onAller: (messageId: string) => void;
}

/**
 * CITATION en tête d'une bulle de réponse : qui, et un extrait de ce qui a été
 * dit. Cliquable, même quand l'original a été retiré : on arrive alors sur la
 * bulle « Ce message a été supprimé », ce qui explique la citation vide.
 */
function CitationMessage({ citation, moiId, variante, onAller }: CitationMessageProps) {
  const nom = nomAuteurCitation(citation, moiId);
  const texte = texteCitation(citation);
  const style = STYLE[variante];
  const Icone =
    citation.deleted
      ? null
      : citation.kind === 'image'
        ? ImageIcon
        : citation.kind === 'audio'
          ? Mic
          : citation.kind === 'alert'
            ? AlertTriangle
            : null;

  return (
    // Le cadre porte la marge : un bouton ne s'étire pas seul sur la largeur
    // de la bulle, il faut lui donner `w-full` dans un bloc qui, lui, s'étire.
    <div className="px-1.5 pt-1.5">
      <button
        type="button"
        onClick={() => onAller(citation.id)}
        aria-label={`${
          nom === 'Vous' ? 'Aller à votre message cité' : `Aller au message cité de ${nom}`
        }${texte ? ` : ${texte}` : ''}`}
        title="Voir le message d'origine"
        className={`block w-full min-w-[9rem] rounded-lg border-l-2 px-2.5 py-1.5 text-left transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F17922]/70 ${style.cadre}`}
      >
        <span className={`block truncate text-xs font-semibold ${style.nom}`}>{nom}</span>
        <span className={`mt-0.5 flex items-start gap-1 text-xs leading-snug ${style.texte}`}>
          {Icone && <Icone aria-hidden="true" className="mt-px h-3.5 w-3.5 shrink-0" />}
          <span className={`line-clamp-2 break-words ${citation.deleted ? 'italic' : ''}`}>{texte}</span>
        </span>
      </button>
    </div>
  );
}

export default CitationMessage;
