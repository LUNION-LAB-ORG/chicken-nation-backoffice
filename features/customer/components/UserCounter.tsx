"use client";

import { Users } from "lucide-react";

interface UserCounterProps {
  count: number;
  /** Libellé du bandeau : il suit l'onglet, le compteur aussi. */
  libelle?: string;
  /** Tant que la liste charge, on ne montre pas un chiffre qu'on n'a pas. */
  chargement?: boolean;
}

/**
 * Compteur de l'onglet ouvert, en tête de la liste des clients.
 *
 * ⚠️ Il compte le TOTAL DE L'ONGLET ACTIF, pas les utilisateurs de
 * l'application. Le bandeau annonçait « nombre d'utilisateurs app » quel que
 * soit l'onglet : sur « Tous », il affichait donc tous les clients sous un
 * titre qui promettait autre chose. Le libellé vient désormais de l'onglet.
 *
 * Et pendant le chargement il montrait « 0 clients », faute d'un repli à
 * zéro sur une donnée simplement pas encore arrivée. Un zéro est une réponse,
 * pas une attente : on affiche une barre grise le temps de savoir.
 */
export function UserCounter({
  count = 0,
  libelle = "Clients",
  chargement = false,
}: UserCounterProps) {
  return (
    <div className="w-full max-w-xs rounded-3xl relative border border-gray-200 bg-white p-6 shadow-sm">
      {/*
        Largeur automatique : le bandeau était figé à w-52, et un libellé un
        peu long passait à la ligne en débordant de la pastille bleue.
      */}
      <div className="absolute top-0 left-5 h-7 max-w-[calc(100%-2.5rem)] rounded-b-xl bg-[#007AFF] px-4 text-white flex items-center">
        <span className="text-xs font-normal uppercase tracking-wide truncate">
          {libelle}
        </span>
      </div>

      <div className="mt-6 flex items-center justify-between gap-3">
        {chargement ? (
          <span
            role="status"
            aria-label="Chargement du nombre de clients"
            className="h-6 w-28 rounded-md bg-gray-200 animate-pulse"
          />
        ) : (
          <h2 className="text-xl font-medium text-[#9796A1] tabular-nums">
            {count.toLocaleString("fr-FR")} client{count > 1 ? "s" : ""}
          </h2>
        )}

        <Users className="h-7 w-7 shrink-0 text-[#F17922]" />
      </div>
    </div>
  );
}
