'use client';

import { AlertTriangle, ChevronDown, ChevronRight, RotateCw } from 'lucide-react';
import React, { useEffect, useState } from 'react';

import { personneEnService, type SectionEnDirect } from '../utils/groupes-en-direct';
import { LigneLivreur, idLigneLivreur } from './LigneLivreur';

/**
 * « LIVREURS » D'EN DIRECT (conception du 24/10, 9.3) : les livreurs groupés
 * par section, dans cet ordre : En course, Au restaurant, Disponibles, En
 * pause, Appli fermée, Hors service (repliée). Une section vide ne
 * s'affiche pas.
 *
 * Le livreur choisi (toucher d'une ligne, d'un marqueur ou d'une alerte) est
 * amené à l'écran ; s'il est hors service, la section se déplie.
 */

export interface ListeEnDirectProps {
  sections: SectionEnDirect[];
  choisi: string | null;
  onChoisir: (livreurId: string) => void;
  /** Premier chargement. */
  chargement: boolean;
  /** Erreur de lecture : avec `sections` vides, ligne rouge et « Réessayer ». */
  erreur: boolean;
  onReessayer: () => void;
  reessaiEnCours: boolean;
}

function Squelette() {
  return (
    <div aria-hidden>
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex h-14 items-center gap-2.5 px-3">
          <div className="h-9 w-9 shrink-0 animate-pulse rounded-full bg-[#F4F4F5]" />
          <div className="min-w-0 flex-1 space-y-1.5">
            <div className="h-3 w-40 animate-pulse rounded-full bg-[#F4F4F5]" />
            <div className="h-2.5 w-28 animate-pulse rounded-full bg-[#F4F4F5]" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ListeEnDirect({
  sections,
  choisi,
  onChoisir,
  chargement,
  erreur,
  onReessayer,
  reessaiEnCours,
}: ListeEnDirectProps) {
  const [horsServiceOuvert, setHorsServiceOuvert] = useState(false);
  const horsService = sections.find((s) => s.cle === 'HORS_SERVICE');
  const choisiHorsService = !!choisi && !!horsService?.lignes.some((l) => l.id === choisi);

  // Livreur choisi hors service : la section se déplie.
  useEffect(() => {
    if (choisiHorsService) setHorsServiceOuvert(true);
  }, [choisiHorsService, choisi]);

  // Livreur choisi : sa ligne est amenée à l'écran.
  useEffect(() => {
    if (!choisi) return;
    const id = window.requestAnimationFrame(() => {
      document.getElementById(idLigneLivreur(choisi))?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    });
    return () => window.cancelAnimationFrame(id);
  }, [choisi, horsServiceOuvert]);

  let contenu: React.ReactNode;
  if (sections.length === 0 && erreur) {
    contenu = (
      <div className="flex items-center gap-3 px-3 py-3 text-sm text-red-600">
        <AlertTriangle className="h-4 w-4 shrink-0" />
        <span className="min-w-0 flex-1">Impossible de charger les positions.</span>
        <button
          type="button"
          onClick={onReessayer}
          disabled={reessaiEnCours}
          className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-red-200 px-2 py-1 text-xs font-semibold hover:bg-red-50 disabled:opacity-50"
        >
          <RotateCw className={`h-3.5 w-3.5 ${reessaiEnCours ? 'animate-spin' : ''}`} />
          Réessayer
        </button>
      </div>
    );
  } else if (sections.length === 0 && chargement) {
    contenu = <Squelette />;
  } else {
    contenu = (
      <>
        {erreur && (
          <p className="mx-3 mb-1 border-l-2 border-red-500 pl-2 text-xs text-red-600">
            Connexion perdue, nouvel essai en cours
          </p>
        )}
        {personneEnService(sections) && (
          <p className="px-3 py-3 text-sm text-[#A1A1AA]">Aucun livreur en service.</p>
        )}
        {sections.map((section) => {
          const repliee = section.cle === 'HORS_SERVICE';
          const ouverte = !repliee || horsServiceOuvert;
          return (
            <section key={section.cle} className="border-t border-[#F4F4F5] first:border-t-0">
              {repliee ? (
                <button
                  type="button"
                  onClick={() => setHorsServiceOuvert((v) => !v)}
                  aria-expanded={ouverte}
                  className="flex w-full items-center gap-1.5 px-3 py-2 text-left text-xs font-semibold text-[#71717A] hover:bg-[#FAFAFA]"
                >
                  {ouverte ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                  {section.titre} {section.lignes.length}
                </button>
              ) : (
                <h4 className="px-3 pb-1 pt-2.5 text-xs font-semibold text-[#71717A]">
                  {section.titre} {section.lignes.length}
                </h4>
              )}
              {ouverte &&
                section.lignes.map((ligne) => (
                  <LigneLivreur key={ligne.id} ligne={ligne} choisi={choisi === ligne.id} onChoisir={onChoisir} />
                ))}
            </section>
          );
        })}
      </>
    );
  }

  return (
    <section className="pb-1">
      <h3 className="px-3 pb-1 pt-3 text-sm font-semibold text-[#18181B]">Livreurs</h3>
      {contenu}
    </section>
  );
}

export default ListeEnDirect;
