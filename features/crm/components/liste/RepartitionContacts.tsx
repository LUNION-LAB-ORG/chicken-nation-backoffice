"use client";

import React from "react";
import { useRepartitionQuery } from "../../queries/contact.query";
import { IContactFiltres, Public } from "../../types/contact.type";
import { PUBLIC_META, fmtNombre } from "../../utils/crm-ui";

const LIBELLE_COMPTE: Record<string, string> = {
  avec_app: "Application installée",
  sans_app: "Sans l'application",
  a_commande: "A déjà commandé",
  jamais_commande: "N'a jamais commandé",
  profil_incomplet: "Profil incomplet",
};

function Pastille({
  libelle,
  nombre,
  actif,
  onBasculer,
}: {
  libelle: string;
  nombre: number;
  actif: boolean;
  onBasculer: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onBasculer}
      aria-pressed={actif}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition-colors cursor-pointer ${
        actif
          ? "border-[#F17922] bg-[#FDF3E7] text-[#8A4B00]"
          : "border-gray-200 bg-white text-gray-600 hover:border-[#F17922]/50"
      }`}
    >
      <span className="font-medium">{libelle}</span>
      <span className="font-bold tabular-nums">{fmtNombre(nombre)}</span>
    </button>
  );
}

/**
 * COMBIEN DANS CHAQUE PUBLIC, au-dessus de la liste.
 *
 * La liste n'affichait qu'un total : connaître la répartition demandait de
 * filtrer quatre fois de suite en notant les résultats. Supportable quand le
 * CRM ne portait que les cibles de relance, absurde depuis qu'il porte tout
 * le fichier client.
 *
 * Les décomptes suivent les filtres actifs — ils décrivent ce qu'on regarde —
 * SAUF le public et le compte eux-mêmes : sans quoi cliquer sur « Glovo »
 * mettrait tous les autres à zéro et la bande deviendrait un cul-de-sac.
 * Cliquer une pastille déjà active la retire.
 */
export function RepartitionContacts({
  filtres,
  onChange,
}: {
  filtres: IContactFiltres;
  onChange: (f: IContactFiltres) => void;
}) {
  const { data } = useRepartitionQuery(filtres);
  if (!data) return null;

  const publics = data.publics.filter((p) => p.nombre > 0);
  const comptes = data.comptes.filter((c) => c.nombre > 0);
  if (publics.length === 0 && comptes.length === 0) return null;

  const basculer = (partiel: Partial<IContactFiltres>) =>
    onChange({ ...filtres, ...partiel, page: 1 });

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {publics.map((p) => (
        <Pastille
          key={p.segment}
          libelle={PUBLIC_META[p.segment as Public]?.label ?? p.segment}
          nombre={p.nombre}
          actif={filtres.segment === p.segment}
          onBasculer={() =>
            basculer({ segment: filtres.segment === p.segment ? undefined : (p.segment as Public) })
          }
        />
      ))}

      {publics.length > 0 && comptes.length > 0 && (
        <span className="mx-1 h-4 w-px bg-gray-200" aria-hidden />
      )}

      {comptes.map((c) => (
        <Pastille
          key={c.compte}
          libelle={LIBELLE_COMPTE[c.compte] ?? c.compte}
          nombre={c.nombre}
          actif={filtres.compte === c.compte}
          onBasculer={() =>
            basculer({
              compte: filtres.compte === c.compte ? undefined : (c.compte as IContactFiltres["compte"]),
            })
          }
        />
      ))}
    </div>
  );
}
