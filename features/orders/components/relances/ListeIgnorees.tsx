"use client";

import React from "react";
import { Loader2, RotateCcw } from "lucide-react";
import { fmtMontant } from "../../../crm/utils/crm-ui";
import { LIBELLE_RAISON } from "../../constantes/relance.constante";
import { useRelancesIgnoreesQuery } from "../../queries/relance.query";
import { useRetablirRelance } from "../../queries/relance.mutation";
import { IgnoreeLigne } from "../../types/relance.types";
import { ilYa } from "../../utils/relance";

/** « Client injoignable », ou le texte libre de « Autre ». */
const raisonDe = (l: IgnoreeLigne) =>
  (l.raison_code === "AUTRE" && l.raison_texte) || l.raison_libelle || LIBELLE_RAISON[l.raison_code] || l.raison_texte || "";

function LigneIgnoree({ ligne, maintenant }: { ligne: IgnoreeLigne; maintenant: number }) {
  const retablir = useRetablirRelance();
  const auteur = ligne.ignore_par?.fullname;
  const raison = raisonDe(ligne);

  return (
    <li className="rounded-2xl border border-gray-200 bg-white p-3 sm:p-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 space-y-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
          <span className="font-semibold text-gray-900 break-words">{ligne.client_nom}</span>
          <span className="font-mono text-xs text-gray-600">{ligne.reference}</span>
          <span className="text-xs font-semibold text-gray-700">{fmtMontant(ligne.amount)}</span>
          {!ligne.encore_en_attente && (
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-semibold text-gray-600">
              Plus en attente
            </span>
          )}
        </div>
        <p className="text-xs text-gray-500">
          {auteur ? `Ignorée par ${auteur}` : "Ignorée"} {ilYa(ligne.ignore_le, maintenant)}
          {raison ? ` : ${raison}` : ""}
        </p>
      </div>
      <button
        type="button"
        disabled={retablir.isPending}
        onClick={() => retablir.mutate(ligne.id)}
        className="self-start sm:self-auto inline-flex items-center gap-1.5 h-10 sm:h-9 px-3.5 rounded-xl border border-gray-200 bg-white text-[13px] font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 cursor-pointer whitespace-nowrap"
      >
        {retablir.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
        Rétablir
      </button>
    </li>
  );
}

/** Vue « Ignorées » : les relances écartées depuis 24 h, par toute l'équipe. */
export function ListeIgnorees({ maintenant, restaurantId }: { maintenant: number; restaurantId: string | null }) {
  const { data, isLoading, isError, refetch } = useRelancesIgnoreesQuery(true);

  if (isLoading) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="w-6 h-6 animate-spin text-[#F17922]" />
      </div>
    );
  }
  if (isError) {
    return (
      <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-700 flex flex-wrap items-center gap-3">
        Impossible de charger les commandes ignorées.
        <button type="button" onClick={() => void refetch()} className="font-semibold underline cursor-pointer">
          Réessayer
        </button>
      </div>
    );
  }

  const items = (data?.items ?? []).filter((l) => !restaurantId || l.restaurant?.id === restaurantId);
  if (items.length === 0) {
    return <p className="rounded-2xl border border-dashed border-gray-200 bg-white p-6 text-center text-sm text-gray-500">Aucune commande ignorée depuis 24 h.</p>;
  }

  return (
    <ul className="space-y-2">
      {items.map((l) => (
        <LigneIgnoree key={l.id} ligne={l} maintenant={maintenant} />
      ))}
    </ul>
  );
}
