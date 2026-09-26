"use client";

import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AtSign, Copy, MoreHorizontal, Reply } from 'lucide-react';

interface BarreActionsMessageProps {
  /** La bulle est à droite : la barre se place à sa gauche, côté intérieur du fil. */
  aDroite: boolean;
  onRepondre: () => void;
  /**
   * « Répondre en mentionnant Awa » : proposé dans une conversation interne,
   * quand l'auteur peut être mentionné et que ce n'est pas soi.
   */
  mentionner?: { prenom: string; onChoisir: () => void } | null;
  /** Texte du message, pour « Copier le texte ». Absent : l'action n'est pas proposée. */
  texteACopier?: string | null;
  onCopier?: (texte: string) => void;
}

const LARGEUR_MENU = 248;
const HAUTEUR_ESTIMEE = 132;

/**
 * ACTIONS D'UN MESSAGE, à côté de la bulle : « Répondre » et « Plus ».
 *
 * Discrètes au repos, elles apparaissent au survol de la ligne, dès qu'un de
 * leurs boutons reçoit le focus au clavier, et en permanence sur un écran
 * tactile, où le survol n'existe pas.
 *
 * Posée HORS de la bulle, qui masque ce qui déborde. Le menu « Plus » est
 * rendu dans un portail pour la même raison, et se ferme au défilement comme
 * le sélecteur de réactions.
 */
function BarreActionsMessage({
  aDroite,
  onRepondre,
  mentionner,
  texteACopier,
  onCopier,
}: BarreActionsMessageProps) {
  const [ouvert, setOuvert] = useState(false);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  const declencheur = useRef<HTMLButtonElement | null>(null);
  const menu = useRef<HTMLDivElement | null>(null);

  const placer = useCallback(() => {
    const el = declencheur.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const gauche = aDroite ? r.right - LARGEUR_MENU : r.left;
    const enDessous = r.bottom + 6 + HAUTEUR_ESTIMEE < window.innerHeight;
    setPosition({
      top: enDessous ? r.bottom + 6 : Math.max(8, r.top - 6 - HAUTEUR_ESTIMEE),
      left: Math.min(Math.max(8, gauche), window.innerWidth - LARGEUR_MENU - 8),
    });
  }, [aDroite]);

  useLayoutEffect(() => {
    if (ouvert) placer();
  }, [ouvert, placer]);

  const fermer = useCallback((rendreLeFocus: boolean) => {
    setOuvert(false);
    if (rendreLeFocus) declencheur.current?.focus();
  }, []);

  useEffect(() => {
    if (!ouvert) return;
    // Premier choix sous le doigt du clavier dès l'ouverture.
    const premier = menu.current?.querySelector<HTMLButtonElement>('[role="menuitem"]');
    premier?.focus();

    const surDefilement = () => setOuvert(false);
    const surClic = (e: MouseEvent) => {
      const cible = e.target as Node;
      if (menu.current?.contains(cible) || declencheur.current?.contains(cible)) return;
      setOuvert(false);
    };
    window.addEventListener('scroll', surDefilement, true);
    window.addEventListener('resize', surDefilement);
    document.addEventListener('mousedown', surClic);
    return () => {
      window.removeEventListener('scroll', surDefilement, true);
      window.removeEventListener('resize', surDefilement);
      document.removeEventListener('mousedown', surClic);
    };
  }, [ouvert, position]);

  const surToucheMenu = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const elements = Array.from(menu.current?.querySelectorAll<HTMLButtonElement>('[role="menuitem"]') ?? []);
    const i = elements.indexOf(document.activeElement as HTMLButtonElement);
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      fermer(true);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      elements[(i + 1) % elements.length]?.focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      elements[(i - 1 + elements.length) % elements.length]?.focus();
    } else if (e.key === 'Tab') {
      fermer(false);
    }
  };

  const choisir = (action: () => void) => {
    setOuvert(false);
    action();
  };

  const bouton =
    'inline-flex h-7 w-7 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F17922]/60 cursor-pointer';
  const ligne =
    'flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-[13px] text-gray-700 hover:bg-gray-50 focus:bg-gray-50 focus:outline-none cursor-pointer';

  return (
    <div
      className={`flex shrink-0 items-center gap-0.5 self-center transition-opacity ${
        ouvert
          ? 'opacity-100'
          : 'opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 pointer-coarse:opacity-100'
      } ${aDroite ? 'flex-row-reverse' : ''}`}
    >
      <button
        type="button"
        onClick={onRepondre}
        aria-label="Répondre à ce message"
        title="Répondre"
        className={bouton}
      >
        <Reply className="h-4 w-4" />
      </button>
      <button
        ref={declencheur}
        type="button"
        onClick={() => setOuvert((v) => !v)}
        aria-label="Plus d'actions"
        aria-haspopup="menu"
        aria-expanded={ouvert}
        title="Plus d'actions"
        className={bouton}
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>

      {ouvert &&
        position &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            ref={menu}
            role="menu"
            aria-label="Actions sur le message"
            onKeyDown={surToucheMenu}
            style={{ top: position.top, left: position.left, width: LARGEUR_MENU }}
            className="fixed z-[60] overflow-hidden rounded-xl border border-gray-200 bg-white py-1 shadow-lg"
          >
            <button type="button" role="menuitem" className={ligne} onClick={() => choisir(onRepondre)}>
              <Reply className="h-4 w-4 text-gray-400" />
              Répondre
            </button>
            {mentionner && (
              <button
                type="button"
                role="menuitem"
                className={ligne}
                onClick={() => choisir(mentionner.onChoisir)}
              >
                <AtSign className="h-4 w-4 text-gray-400" />
                <span className="truncate">Répondre en mentionnant {mentionner.prenom}</span>
              </button>
            )}
            {texteACopier && onCopier && (
              <button
                type="button"
                role="menuitem"
                className={ligne}
                onClick={() => choisir(() => onCopier(texteACopier))}
              >
                <Copy className="h-4 w-4 text-gray-400" />
                Copier le texte
              </button>
            )}
          </div>,
          document.body,
        )}
    </div>
  );
}

export default BarreActionsMessage;
