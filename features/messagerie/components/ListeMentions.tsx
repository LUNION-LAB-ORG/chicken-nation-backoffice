"use client";

import React, { useEffect } from 'react';
import Image from 'next/image';
import type { OptionMention } from '../hooks/use-mentions-composeur';
import { LIBELLE_ROLE } from '../hooks/use-collegues';
import { positionSansAccents } from '../utils/mentions-texte';

interface ListeMentionsProps {
  idListe: string;
  idOption: (i: number) => string;
  options: OptionMention[];
  indexActif: number;
  terme: string;
  onChoisir: (option: OptionMention) => void;
  onSurvol: (i: number) => void;
  /** Adresse affichable d'une photo de profil (clé de stockage ou URL). */
  resoudreImage: (chemin: string) => string;
}

/** « Awa Ko|né » : la partie trouvée en gras, le reste en clair. */
function NomSurligne({ nom, terme }: { nom: string; terme: string }) {
  const plage = positionSansAccents(nom, terme.trim());
  if (!plage) return <>{nom}</>;
  const [debut, fin] = plage;
  return (
    <>
      {nom.slice(0, debut)}
      <strong className="font-semibold text-gray-900">{nom.slice(debut, fin)}</strong>
      {nom.slice(fin)}
    </>
  );
}

const initiales = (nom: string) =>
  nom
    .split(/\s+/)
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

/**
 * LISTE DES PERSONNES À MENTIONNER, au-dessus du champ.
 *
 * Les membres qui n'ont pas accès à la messagerie (cuisine, marketing,
 * comptabilité) restent visibles, grisés, avec la raison : sinon on les
 * cherche en vain sans comprendre pourquoi ils n'apparaissent pas.
 *
 * `onMouseDown` empêché : le champ garde le focus, et donc le curseur, pendant
 * qu'on clique sur un nom.
 */
function ListeMentions({
  idListe,
  idOption,
  options,
  indexActif,
  terme,
  onChoisir,
  onSurvol,
  resoudreImage,
}: ListeMentionsProps) {
  // L'option active reste visible quand on parcourt la liste au clavier. Le
  // défilement est fait à la main, dans la liste seule : `scrollIntoView`
  // pourrait faire bouger la page entière.
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const liste = document.getElementById(idListe);
    const option = document.getElementById(idOption(indexActif));
    if (!liste || !option) return;
    if (option.offsetTop < liste.scrollTop) {
      liste.scrollTop = option.offsetTop;
    } else if (option.offsetTop + option.offsetHeight > liste.scrollTop + liste.clientHeight) {
      liste.scrollTop = option.offsetTop + option.offsetHeight - liste.clientHeight;
    }
  }, [indexActif, idOption, idListe]);

  return (
    <div
      id={idListe}
      role="listbox"
      aria-label="Personnes à mentionner"
      // Même sur la barre de défilement de la liste, le champ garde le focus.
      onMouseDown={(e) => e.preventDefault()}
      className="absolute bottom-full left-0 right-0 z-30 mb-2 max-h-[16.5rem] overflow-y-auto rounded-xl border border-gray-200 bg-white py-1 shadow-lg"
    >
      {options.map((option, i) => {
        const { participant, mentionnable } = option;
        const actif = i === indexActif && mentionnable;
        return (
          <div
            key={participant.id}
            id={idOption(i)}
            role="option"
            aria-selected={actif}
            aria-disabled={!mentionnable}
            onMouseDown={(e) => e.preventDefault()}
            onMouseEnter={() => mentionnable && onSurvol(i)}
            onClick={() => mentionnable && onChoisir(option)}
            className={`flex h-11 items-center gap-2.5 px-3 ${
              mentionnable
                ? `cursor-pointer ${actif ? 'bg-orange-50' : 'hover:bg-gray-50'}`
                : 'cursor-not-allowed opacity-55'
            }`}
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-200 text-[10px] font-bold text-gray-600">
              {participant.image ? (
                <Image
                  src={resoudreImage(participant.image)}
                  alt=""
                  width={28}
                  height={28}
                  className="h-7 w-7 rounded-full object-cover"
                />
              ) : (
                initiales(participant.fullName)
              )}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[13px] text-gray-700">
                <NomSurligne nom={participant.fullName} terme={terme} />
              </span>
              <span className="block truncate text-[11px] text-gray-400">
                {mentionnable
                  ? LIBELLE_ROLE[participant.role] ?? participant.role
                  : "Pas d'accès à la messagerie"}
              </span>
            </span>
          </div>
        );
      })}
    </div>
  );
}

export default ListeMentions;
