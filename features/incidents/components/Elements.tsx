import React from "react";
import type { IncidentGravite, IncidentStatut } from "../types/incident.types";
import { COULEUR_GRAVITE, COULEUR_STATUT, LIBELLE_GRAVITE, LIBELLE_STATUT, type Couleur } from "../utils/incident";

/** Petits éléments communs au tableau, à l'historique et à la fiche des incidents. */

export const classeChamp =
  "w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 outline-none focus:border-[#F17922] focus:ring-2 focus:ring-orange-100 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400";

export function Pastille({ couleur, children, className = "" }: { couleur: Couleur; children: React.ReactNode; className?: string }) {
  return (
    <span
      className={`inline-block whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ${className}`}
      style={{ backgroundColor: couleur.fond, color: couleur.texte }}
    >
      {children}
    </span>
  );
}

export const PastilleStatut = ({ statut }: { statut: IncidentStatut }) => (
  <Pastille couleur={COULEUR_STATUT[statut]}>{LIBELLE_STATUT[statut]}</Pastille>
);

/** « Gravité haute » : le mot seul (« Haute ») ne dit pas de quoi il parle. */
export const PastilleGravite = ({ gravite, court = false }: { gravite: IncidentGravite; court?: boolean }) => (
  <Pastille couleur={COULEUR_GRAVITE[gravite]}>
    {court ? LIBELLE_GRAVITE[gravite] : `Gravité ${LIBELLE_GRAVITE[gravite].toLowerCase()}`}
  </Pastille>
);

export function Bloc({ titre, droite, children }: { titre: string; droite?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3 rounded-xl border border-slate-100 bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-bold text-gray-900">{titre}</h3>
        {droite}
      </div>
      {children}
    </section>
  );
}

/** Choix parmi quelques valeurs : des boutons, plus rapides qu'une liste déroulante. */
export function Choix<V extends string | number>({
  label,
  valeur,
  options,
  onChange,
  desactive,
}: {
  label: string;
  valeur: V | "" | null;
  options: { valeur: V; libelle: string }[];
  onChange: (v: V) => void;
  desactive?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold text-gray-600">{label}</span>
      <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-1.5">
        {options.map((o) => {
          const choisi = o.valeur === valeur;
          return (
            <button
              key={String(o.valeur)}
              type="button"
              role="radio"
              aria-checked={choisi}
              disabled={desactive}
              onClick={() => onChange(o.valeur)}
              className={`min-h-9 rounded-full border px-3.5 py-1.5 text-[13px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                choisi
                  ? "border-[#F17922] bg-[#F17922] text-white"
                  : "border-gray-200 bg-white text-gray-700 hover:border-[#F17922]/50"
              }`}
            >
              {o.libelle}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function Zone({
  label,
  valeur,
  onChange,
  placeholder,
  max,
  lignes = 3,
  desactive,
}: {
  label: string;
  valeur: string;
  onChange: (v: string) => void;
  placeholder?: string;
  max: number;
  lignes?: number;
  desactive?: boolean;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold text-gray-600">{label}</span>
      <textarea
        value={valeur}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={max}
        rows={lignes}
        disabled={desactive}
        className={`${classeChamp} resize-y`}
      />
    </label>
  );
}

/** Ligne « libellé : valeur » des panneaux de droite. */
export function Info({ libelle, children }: { libelle: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3 text-[13px]">
      <dt className="shrink-0 text-gray-500">{libelle}</dt>
      <dd className="min-w-0 text-right font-semibold text-gray-900">{children}</dd>
    </div>
  );
}
