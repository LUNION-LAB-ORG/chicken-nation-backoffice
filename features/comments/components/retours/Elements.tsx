import React from "react";
import type { AvisRessenti, AvisStatut } from "../../types/avis-prive.types";
import { COULEUR_RESSENTI, COULEUR_STATUT, LIBELLE_RESSENTI, LIBELLE_STATUT, type Couleur } from "../../utils/avis-prive";

/** Petits éléments communs à la liste et à la fiche des retours privés. */

export const classeChamp =
  "h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-800 outline-none focus:border-[#F17922] focus:ring-2 focus:ring-orange-100 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400";

function Pastille({ couleur, children }: { couleur: Couleur; children: React.ReactNode }) {
  return (
    <span
      className="inline-block whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold"
      style={{ backgroundColor: couleur.fond, color: couleur.texte }}
    >
      {children}
    </span>
  );
}

export const PastilleRessenti = ({ ressenti }: { ressenti: AvisRessenti }) => (
  <Pastille couleur={COULEUR_RESSENTI[ressenti]}>{LIBELLE_RESSENTI[ressenti]}</Pastille>
);

export const PastilleStatut = ({ statut }: { statut: AvisStatut }) => (
  <Pastille couleur={COULEUR_STATUT[statut]}>{LIBELLE_STATUT[statut]}</Pastille>
);

/** « Client rapproché » en vert, « Non rapproché » en orange. */
export const Rapprochement = ({ rapproche }: { rapproche: boolean }) => (
  <span className={`text-xs font-semibold ${rapproche ? "text-[#1C5E34]" : "text-[#9A3412]"}`}>
    {rapproche ? "Client rapproché" : "Non rapproché"}
  </span>
);

export function Carte({ titre, droite, children }: { titre: string; droite?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3 rounded-xl border border-slate-100 bg-white p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-bold text-gray-900">{titre}</h2>
        {droite}
      </div>
      {children}
    </section>
  );
}

export function ChampListe({
  label,
  valeur,
  onChange,
  options,
  vide,
  desactive,
  className,
}: {
  label: string;
  valeur: string;
  onChange: (v: string) => void;
  options: { valeur: string; libelle: string; desactive?: boolean }[];
  /** Première option, vide (« Tous », « Choisir »). */
  vide?: string;
  desactive?: boolean;
  className?: string;
}) {
  return (
    <label className={`flex flex-col gap-1 text-xs font-medium text-gray-500 ${className ?? ""}`}>
      {label}
      <select
        value={valeur}
        onChange={(e) => onChange(e.target.value)}
        disabled={desactive}
        className={`${classeChamp} cursor-pointer`}
      >
        {vide !== undefined && <option value="">{vide}</option>}
        {options.map((o) => (
          <option key={o.valeur} value={o.valeur} disabled={o.desactive}>
            {o.libelle}
          </option>
        ))}
      </select>
    </label>
  );
}
