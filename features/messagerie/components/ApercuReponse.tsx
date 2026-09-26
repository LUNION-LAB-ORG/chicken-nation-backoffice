"use client";

import React from 'react';
import { AlertTriangle, ImageIcon, Mic, Reply, X } from 'lucide-react';
import type { ICitationMessage } from '../types/conversation.type';
import { libelleEnReponseA, texteCitation } from '../utils/citation-locale';

interface ApercuReponseProps {
  citation: ICitationMessage;
  moiId?: string | null;
  onAnnuler: () => void;
  desactive?: boolean;
}

/**
 * « En réponse à Awa Koné », au-dessus du champ de saisie, tant que la
 * réponse n'est pas partie. Échap ou la croix l'annulent.
 */
function ApercuReponse({ citation, moiId, onAnnuler, desactive = false }: ApercuReponseProps) {
  const texte = texteCitation(citation);
  const Icone =
    citation.kind === 'image'
      ? ImageIcon
      : citation.kind === 'audio'
        ? Mic
        : citation.kind === 'alert'
          ? AlertTriangle
          : null;

  return (
    <div className="mb-2 flex items-start gap-2 rounded-r-xl border-l-[3px] border-[#F17922] bg-orange-50/60 py-2 pl-3 pr-1.5">
      <Reply aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-[#F17922]" />
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold text-gray-800">{libelleEnReponseA(citation, moiId)}</p>
        <p className="mt-0.5 flex items-center gap-1 text-xs text-gray-500">
          {Icone && <Icone aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />}
          <span className={`truncate ${citation.deleted ? 'italic' : ''}`}>{texte}</span>
        </p>
      </div>
      <button
        type="button"
        onClick={onAnnuler}
        disabled={desactive}
        aria-label="Annuler la réponse"
        title="Annuler la réponse (Échap)"
        className="shrink-0 rounded-full p-1 transition-colors hover:bg-orange-100 disabled:opacity-50 cursor-pointer"
      >
        <X className="h-4 w-4 text-gray-500" />
      </button>
    </div>
  );
}

export default ApercuReponse;
