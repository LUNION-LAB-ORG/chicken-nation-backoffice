"use client";

import React from "react";

import type { EtatAffiche } from "../../utils/suivi-course";
import { ICONES_ETAT_COURSE } from "./EtatCourseLivreur";

/** Ligne qui demande d'agir : rouge (sac oublié, prête depuis trop longtemps) ou ambre (retenue). */
export interface LigneAction {
  texte: string;
  ton: "rouge" | "ambre";
}

const COULEUR_ETAT: Record<EtatAffiche["ton"], string> = {
  vert: "text-green-700",
  bleu: "text-blue-700",
  ambre: "text-amber-700",
  violet: "text-purple-700",
  gris: "text-gray-600",
  rouge: "text-red-700",
};

interface Props {
  code: string | null | undefined;
  etat: EtatAffiche;
  /** « appli fermée » à la suite de l'état, en gris. */
  appliFermee: string | null;
  /** Restaurant en tête (compte du siège sur « Tous »). */
  restaurant?: string | null;
  /** Seconde ligne, seulement s'il faut agir. */
  action: LigneAction | null;
}

/**
 * En-tête du groupe d'une course (demande du 24/10 au soir) : le code de
 * retrait en grand dans un cadre orange (la caissière le compare à celui que
 * le livreur lui dit), puis en une ligne le livreur et son état
 * (« Koffi · Au restaurant », « Proposée à Awa, réponse avant 12 h 36 »,
 * « Confiée à Turbo »), puis une seconde ligne seulement s'il faut agir.
 *
 * Retirés : le mot « Course », la référence `CRS-…`, « 2 commandes à
 * remettre » et le motif du regroupement (dans la fiche de la course).
 */
export const BandeauCourse: React.FC<Props> = ({ code, etat, appliFermee, restaurant, action }) => {
  const Icone = ICONES_ETAT_COURSE[etat.etat];
  // Sac oublié : la seconde ligne dit tout (« Parti à 12 h 20, ORD-4822 pas remise ») ; ici le livreur seul.
  const etatTexte = etat.etat === "PARTI_SANS_SAC" ? null : etat.libelle;
  const ligne1 = [etat.livreur, etatTexte].filter(Boolean).join(" · ");
  const titre = [restaurant, ligne1, appliFermee].filter(Boolean).join(" · ");

  return (
    <div className="flex items-center gap-3 px-3 py-2.5">
      {code && (
        <div className="shrink-0 rounded-xl border-2 border-[#F17922] bg-white px-2.5 py-1 text-center">
          <div className="text-[9px] font-semibold uppercase tracking-wider text-gray-500">Code</div>
          <div className="font-mono text-2xl font-bold leading-none text-[#F17922]">{code}</div>
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="flex min-w-0 items-center gap-1.5 text-sm" title={titre}>
          <Icone className={`h-4 w-4 shrink-0 ${COULEUR_ETAT[etat.ton]}`} aria-hidden />
          <span className="truncate">
            {restaurant && <span className="font-semibold text-[#F17922]">{restaurant} · </span>}
            <span className={`font-semibold ${COULEUR_ETAT[etat.ton]}`}>{ligne1 || etat.libelle}</span>
            {appliFermee && <span className="text-gray-500"> · {appliFermee}</span>}
          </span>
        </p>
        {action && (
          <p
            className={`mt-0.5 truncate text-xs font-semibold ${action.ton === "rouge" ? "text-red-700" : "text-amber-700"}`}
            title={action.texte}
          >
            {action.texte}
          </p>
        )}
      </div>
    </div>
  );
};
