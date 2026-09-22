"use client";

import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { SmilePlus } from 'lucide-react';
import { EMOJIS_REACTION } from '../constantes/emojis-reaction';
import type { IReaction } from '../types/conversation.type';

/**
 * RÉACTIONS sous une bulle de message, à la manière de WhatsApp.
 *
 * Partagé par la messagerie et les tickets : les deux vues affichent les mêmes
 * pastilles et ouvrent le même sélecteur. La seule chose qui les distingue est
 * la forme de l'auteur, qui reste chez l'appelant et n'entre jamais ici.
 *
 * Le composant ne décide de rien : il montre ce qu'on lui donne et signale le
 * clic. La règle « reposer le même emoji le retire » vit sur le serveur.
 */

interface ReactionsProps {
  reactions?: IReaction[];
  /** Le message est-il du côté droit ? Aligne les pastilles et le sélecteur. */
  aDroite?: boolean;
  /** Appelé avec l'emoji choisi. Poser, remplacer ou retirer se décide côté serveur. */
  onBasculer: (emoji: string) => void;
  /** Coupe l'interaction, par exemple tant que le message n'est pas confirmé. */
  desactive?: boolean;
}

function Reactions({ reactions = [], aDroite = false, onBasculer, desactive = false }: ReactionsProps) {
  const [ouvert, setOuvert] = useState(false);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  const declencheur = useRef<HTMLButtonElement | null>(null);
  const selecteur = useRef<HTMLDivElement | null>(null);

  /**
   * ⚠️ Le sélecteur est rendu dans un PORTAIL, à la racine du document.
   *
   * Le fil de messages défile (`overflow-y-auto`) et la bulle masque ce qui
   * déborde (`overflow-hidden`) : un menu rendu sur place serait rogné par l'un
   * ou l'autre, et au mieux ferait apparaître une barre de défilement. On le
   * sort du flux et on le positionne à la main.
   */
  const placer = useCallback(() => {
    const el = declencheur.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const LARGEUR = 232; // six emojis + la marge intérieure
    const gauche = aDroite ? r.right - LARGEUR : r.left;
    setPosition({
      // Au-dessus du déclencheur, sauf s'il n'y a pas la place : on repasse
      // dessous plutôt que de sortir de l'écran.
      top: r.top > 64 ? r.top - 52 : r.bottom + 8,
      left: Math.min(Math.max(8, gauche), window.innerWidth - LARGEUR - 8),
    });
  }, [aDroite]);

  useLayoutEffect(() => {
    if (ouvert) placer();
  }, [ouvert, placer]);

  useEffect(() => {
    if (!ouvert) return;

    /**
     * Le menu est positionné une fois : si le fil défile, il resterait flottant
     * au mauvais endroit. On le ferme plutôt que de le suivre, ce qui serait
     * saccadé et inutile — l'utilisateur qui défile a changé d'intention.
     * `capture` pour attraper le défilement du conteneur interne, qui ne
     * remonte pas jusqu'à la fenêtre.
     */
    const fermer = () => setOuvert(false);
    const surClic = (e: MouseEvent) => {
      const cible = e.target as Node;
      if (selecteur.current?.contains(cible) || declencheur.current?.contains(cible)) return;
      setOuvert(false);
    };
    const surTouche = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOuvert(false);
    };

    window.addEventListener('scroll', fermer, true);
    window.addEventListener('resize', fermer);
    document.addEventListener('mousedown', surClic);
    document.addEventListener('keydown', surTouche);
    return () => {
      window.removeEventListener('scroll', fermer, true);
      window.removeEventListener('resize', fermer);
      document.removeEventListener('mousedown', surClic);
      document.removeEventListener('keydown', surTouche);
    };
  }, [ouvert]);

  const choisir = (emoji: string) => {
    setOuvert(false);
    onBasculer(emoji);
  };

  const aDesReactions = reactions.length > 0;

  return (
    <div
      className={`flex items-center gap-1 ${aDroite ? 'justify-end' : 'justify-start'} ${
        aDesReactions ? 'mt-1' : ''
      }`}
    >
      {/* Pastilles existantes */}
      {reactions.map((r) => (
        <button
          key={r.emoji}
          type="button"
          disabled={desactive}
          onClick={() => onBasculer(r.emoji)}
          title={r.mine ? 'Retirer ma réaction' : 'Réagir'}
          className={`inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[11px] leading-none transition-colors disabled:opacity-50 cursor-pointer ${
            r.mine
              ? 'border-[#F17922] bg-[#FDF3E7] text-[#8A4B00]'
              : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
          }`}
        >
          <span className="text-[13px] leading-none">{r.emoji}</span>
          {r.count > 1 && <span className="font-medium">{r.count}</span>}
        </button>
      ))}

      {/*
        Le déclencheur reste discret tant qu'on ne survole pas le message, pour
        ne pas parsemer le fil de boutons. Il redevient visible dès qu'il y a
        des réactions, sans quoi on ne saurait pas comment en ajouter une autre.
      */}
      <button
        ref={declencheur}
        type="button"
        disabled={desactive}
        onClick={() => setOuvert((v) => !v)}
        aria-label="Ajouter une réaction"
        className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-gray-400 transition-opacity hover:bg-gray-100 hover:text-gray-600 disabled:opacity-50 cursor-pointer ${
          ouvert || aDesReactions ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
        }`}
      >
        <SmilePlus size={13} />
      </button>

      {ouvert &&
        position &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            ref={selecteur}
            style={{ top: position.top, left: position.left }}
            className="fixed z-[60] flex items-center gap-0.5 rounded-full border border-gray-200 bg-white px-1.5 py-1 shadow-lg"
          >
            {EMOJIS_REACTION.map((emoji) => {
              const deja = reactions.find((r) => r.emoji === emoji)?.mine;
              return (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => choisir(emoji)}
                  aria-label={`Réagir avec ${emoji}`}
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-[18px] leading-none transition-transform hover:scale-125 cursor-pointer ${
                    deja ? 'bg-[#FDF3E7]' : 'hover:bg-gray-50'
                  }`}
                >
                  {emoji}
                </button>
              );
            })}
          </div>,
          document.body,
        )}
    </div>
  );
}

export default Reactions;
