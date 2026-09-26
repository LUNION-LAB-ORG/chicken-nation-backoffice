"use client";

import React, { useMemo } from 'react';
import type { IMentionMessage } from '../types/conversation.type';
import { decouperMentions } from '../utils/mentions-texte';
import type { VarianteBulle } from './HeureMessage';

const STYLE_MENTION: Record<VarianteBulle, string> = {
  orange: 'font-semibold underline decoration-white/60 underline-offset-2',
  blanc: 'font-semibold text-[#F17922]',
  alerte: 'font-semibold',
};

interface TexteAvecMentionsProps {
  texte: string;
  mentions?: IMentionMessage[] | null;
  variante: VarianteBulle;
  /** Le nom de l'utilisateur connecté ressort un peu plus que les autres. */
  moiId?: string | null;
}

/**
 * Corps d'un message avec ses mentions surlignées.
 *
 * Seuls les noms retenus par le serveur sont mis en valeur : un « @ » tapé à
 * la main, sans mention réelle derrière, reste du texte ordinaire. Tout est
 * rendu en texte React, jamais en HTML injecté.
 */
function TexteAvecMentions({ texte, mentions, variante, moiId }: TexteAvecMentionsProps) {
  const segments = useMemo(() => decouperMentions(texte, mentions), [texte, mentions]);

  return (
    <>
      {segments.map((segment, i) =>
        segment.mention ? (
          <span
            key={i}
            className={`${STYLE_MENTION[variante]} ${
              moiId && segment.mention.userId === moiId && variante === 'blanc'
                ? 'rounded bg-orange-100/70 px-0.5'
                : ''
            }`}
          >
            {segment.texte}
          </span>
        ) : (
          <React.Fragment key={i}>{segment.texte}</React.Fragment>
        ),
      )}
    </>
  );
}

export default TexteAvecMentions;
