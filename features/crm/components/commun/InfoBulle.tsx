"use client";

import React, { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Info } from "lucide-react";
import type { Definition, Paragraphe } from "../../utils/definitions-campagne";

/** Marge gardée entre la bulle et les bords de l'écran. */
const MARGE = 12;
/** Écart entre l'icône et la bulle. */
const ECART = 6;
/** Délai avant fermeture quand le pointeur quitte l'icône : le temps de passer sur la bulle. */
const DELAI_FERMETURE = 120;
/** Un défilement juste après l'ouverture vient du focus (le navigateur amène l'icône à l'écran) : il ne ferme pas la bulle. */
const DELAI_DEFILEMENT = 300;

/**
 * Définition d'un indicateur, au survol, au focus clavier et au toucher.
 *
 * La bulle est rendue dans document.body en position fixe : ni une carte au
 * débordement masqué ni un tableau qui défile ne la coupent. Elle passe au-dessus
 * de l'en-tête (z-30) et sous les modales (z-50). Clic et touches ne remontent
 * jamais : une carte cliquable autour ne réagit pas.
 */
export function InfoBulle({ libelle, texte, className = "" }: { libelle: string; texte: Definition; className?: string }) {
  const id = useId();
  const refBouton = useRef<HTMLButtonElement>(null);
  const refBulle = useRef<HTMLDivElement>(null);
  const minuterie = useRef<number | undefined>(undefined);
  const ouverteLe = useRef(0);
  const [monte, setMonte] = useState(false);
  const [ouverte, setOuverte] = useState(false);
  // Ouverte d'un clic ou d'un toucher : elle reste jusqu'au clic suivant, Échap, un clic ailleurs ou un défilement.
  const [epinglee, setEpinglee] = useState(false);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);

  // Rien dans document.body avant le montage : le rendu serveur et le premier rendu client restent identiques.
  useEffect(() => setMonte(true), []);
  useEffect(() => () => window.clearTimeout(minuterie.current), []);

  const ouvrir = () => {
    window.clearTimeout(minuterie.current);
    setOuverte(true);
  };

  const fermer = useCallback(() => {
    window.clearTimeout(minuterie.current);
    setOuverte(false);
    setEpinglee(false);
    setPosition(null);
  }, []);

  const fermerBientot = () => {
    if (epinglee) return;
    window.clearTimeout(minuterie.current);
    minuterie.current = window.setTimeout(fermer, DELAI_FERMETURE);
  };

  /** Au-dessus de l'icône s'il y a la place, sinon en dessous ; toujours à 12 px au moins des bords. */
  const placer = useCallback(() => {
    const bouton = refBouton.current;
    const bulle = refBulle.current;
    if (!bouton || !bulle) return;
    const b = bouton.getBoundingClientRect();
    const largeur = bulle.offsetWidth;
    const hauteur = bulle.offsetHeight;
    const largeurEcran = document.documentElement.clientWidth;
    const hauteurEcran = window.innerHeight;
    const left = Math.max(MARGE, Math.min(b.left + b.width / 2 - largeur / 2, largeurEcran - MARGE - largeur));
    const dessus = b.top - ECART - hauteur;
    const dessous = b.bottom + ECART;
    const top =
      dessus >= MARGE
        ? dessus
        : dessous + hauteur <= hauteurEcran - MARGE
          ? dessous
          : // Place nulle part : le côté le plus grand, bulle bornée à l'écran.
            b.top > hauteurEcran - b.bottom
            ? MARGE
            : Math.max(MARGE, hauteurEcran - MARGE - hauteur);
    setPosition((p) => (p && p.top === top && p.left === left ? p : { top, left }));
  }, []);

  useLayoutEffect(() => {
    if (ouverte) ouverteLe.current = Date.now();
  }, [ouverte]);

  // Mesurée avant d'être peinte : la bulle n'apparaît jamais au mauvais endroit, même si son texte change.
  useLayoutEffect(() => {
    if (ouverte && monte) placer();
  }, [ouverte, monte, placer, texte]);

  useEffect(() => {
    if (!ouverte) return;
    const dedans = (cible: EventTarget | null) =>
      cible instanceof Node && (!!refBouton.current?.contains(cible) || !!refBulle.current?.contains(cible));
    const surPointeur = (e: PointerEvent) => {
      if (!dedans(e.target)) fermer();
    };
    const surTouche = (e: KeyboardEvent) => {
      if (e.key === "Escape") fermer();
    };
    const surDefilement = (e: Event) => {
      if (dedans(e.target)) return;
      if (Date.now() - ouverteLe.current < DELAI_DEFILEMENT) placer();
      else fermer();
    };
    // Une bulle qui change de taille après coup (police chargée en retard) est replacée, jamais laissée hors de l'écran.
    const surTaille = typeof ResizeObserver !== "undefined" ? new ResizeObserver(() => placer()) : null;
    if (refBulle.current) surTaille?.observe(refBulle.current);
    document.addEventListener("pointerdown", surPointeur, true);
    document.addEventListener("keydown", surTouche);
    window.addEventListener("scroll", surDefilement, true);
    window.addEventListener("resize", fermer);
    return () => {
      surTaille?.disconnect();
      document.removeEventListener("pointerdown", surPointeur, true);
      document.removeEventListener("keydown", surTouche);
      window.removeEventListener("scroll", surDefilement, true);
      window.removeEventListener("resize", fermer);
    };
  }, [ouverte, fermer, placer]);

  const paragraphes: readonly Paragraphe[] = typeof texte === "string" ? [texte] : texte;

  return (
    <>
      <button
        ref={refBouton}
        type="button"
        aria-label={`Définition : ${libelle}`}
        aria-describedby={ouverte ? id : undefined}
        // Survol à la souris seulement : au toucher, c'est le clic qui ouvre (sinon iOS avale le premier toucher).
        onPointerEnter={(e) => e.pointerType === "mouse" && ouvrir()}
        onPointerLeave={(e) => e.pointerType === "mouse" && fermerBientot()}
        onFocus={ouvrir}
        onBlur={(e) => {
          // Clic sur la bulle ou sur la page : le clic lui-même décide. Tabulation vers un autre élément : on ferme.
          if (epinglee && !e.relatedTarget) return;
          fermer();
        }}
        onClick={(e) => {
          e.stopPropagation();
          if (epinglee) {
            fermer();
            return;
          }
          ouvrir();
          setEpinglee(true);
        }}
        onKeyDown={(e) => {
          e.stopPropagation();
          if (e.key === "Escape" && ouverte) fermer();
        }}
        className={`inline-flex shrink-0 items-center justify-center rounded-full p-1 -m-1 cursor-help text-gray-400 hover:text-gray-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F17922] focus-visible:ring-offset-1 ${className}`}
      >
        <Info aria-hidden className="w-3.5 h-3.5" />
      </button>
      {monte &&
        ouverte &&
        createPortal(
          <div
            ref={refBulle}
            id={id}
            role="tooltip"
            onPointerEnter={(e) => e.pointerType === "mouse" && ouvrir()}
            onPointerLeave={(e) => e.pointerType === "mouse" && fermerBientot()}
            // La bulle vit dans document.body, mais ses événements React remontent vers l'icône : on les arrête ici aussi.
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
            style={{
              top: position?.top ?? 0,
              left: position?.left ?? 0,
              visibility: position ? "visible" : "hidden",
              maxWidth: `min(18rem, calc(100vw - ${2 * MARGE}px))`,
              maxHeight: `calc(100vh - ${2 * MARGE}px)`,
            }}
            className="fixed z-40 w-max overflow-y-auto space-y-2 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-left text-xs font-normal normal-case leading-relaxed tracking-normal whitespace-normal text-gray-600 shadow-lg"
          >
            {paragraphes.map((p, i) =>
              typeof p === "string" ? (
                <p key={i}>{p}</p>
              ) : (
                <p key={i}>
                  <span className="block font-semibold text-gray-900">{p.terme}</span>
                  {p.texte}
                </p>
              ),
            )}
          </div>,
          document.body,
        )}
    </>
  );
}
