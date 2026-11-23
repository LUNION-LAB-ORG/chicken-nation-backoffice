"use client";

import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

interface InfoBulleProps {
  /** Contenu de la bulle. `null` : pas de bulle, l'élément s'affiche seul. */
  contenu: React.ReactNode | null;
  children: React.ReactNode;
  className?: string;
}

const LARGEUR = 280;
const MARGE = 8;
const DELAI_MS = 300;

/**
 * Bulle d'information au survol (et au focus clavier), au-dessus de
 * l'élément, en dessous s'il touche le haut de l'écran.
 *
 * Posée sur la page : les grilles de plats défilent dans leur cadre et sont
 * des conteneurs de requête, une bulle placée dedans serait coupée ou mal
 * placée. Elle disparaît dès que la page ou la grille défile.
 */
const InfoBulle: React.FC<InfoBulleProps> = ({ contenu, children, className }) => {
  const ancre = useRef<HTMLDivElement>(null);
  const minuteur = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [cadre, setCadre] = useState<DOMRect | null>(null);

  const fermer = () => {
    if (minuteur.current) clearTimeout(minuteur.current);
    minuteur.current = null;
    setCadre(null);
  };
  const ouvrir = () => {
    if (!contenu) return;
    if (minuteur.current) clearTimeout(minuteur.current);
    minuteur.current = setTimeout(() => {
      if (ancre.current) setCadre(ancre.current.getBoundingClientRect());
    }, DELAI_MS);
  };

  useEffect(() => {
    if (!cadre) return;
    window.addEventListener("scroll", fermer, true);
    window.addEventListener("resize", fermer);
    return () => {
      window.removeEventListener("scroll", fermer, true);
      window.removeEventListener("resize", fermer);
    };
  }, [cadre]);

  useEffect(() => () => {
    if (minuteur.current) clearTimeout(minuteur.current);
  }, []);

  const dessus = cadre ? cadre.top > 140 : true;
  const gauche = cadre
    ? Math.min(
        Math.max(cadre.left + cadre.width / 2 - LARGEUR / 2, MARGE),
        window.innerWidth - LARGEUR - MARGE,
      )
    : 0;

  return (
    <div
      ref={ancre}
      className={className}
      onMouseEnter={ouvrir}
      onMouseLeave={fermer}
      onFocus={ouvrir}
      onBlur={fermer}
      onClick={fermer}
    >
      {children}
      {cadre &&
        contenu &&
        createPortal(
          <div
            role="tooltip"
            style={{
              position: "fixed",
              left: gauche,
              width: LARGEUR,
              top: dessus ? cadre.top - MARGE : cadre.bottom + MARGE,
              transform: dessus ? "translateY(-100%)" : undefined,
            }}
            className="pointer-events-none z-[70] rounded-xl bg-gray-900 dark:bg-[#0e1014] px-3.5 py-2.5 text-xs leading-relaxed text-blanc shadow-xl"
          >
            {contenu}
          </div>,
          document.body,
        )}
    </div>
  );
};

export default InfoBulle;
