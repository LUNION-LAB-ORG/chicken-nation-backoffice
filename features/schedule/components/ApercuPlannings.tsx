"use client";

import React from "react";
import { AlertCircle } from "lucide-react";

import { useApercuPlanningsQuery } from "../queries/schedule.query";
import { estRouteAbsente } from "../services/schedule.service";
import type { IApercuPlanning } from "../types/schedule.types";
import { LIBELLE_ETAT } from "../utils/actions-planning";
import {
  cleAujourdhui,
  periode,
  suivantManquant,
  textePrevus,
  texteReponses,
} from "../utils/periode-planning";

interface Props {
  /** Toucher une ligne choisit le restaurant. */
  onChoisir: (restaurantId: string) => void;
}

/**
 * « Plannings des restaurants » : le siège sur « Tous les restaurants »
 * (conception du 24/10, 10.3), données `GET /schedule/apercu`.
 *
 * Serveur ancien (route absente) : le tableau ne s'affiche pas, les onglets
 * des restaurants gardent le choix.
 */
export function ApercuPlannings({ onChoisir }: Props) {
  const { data, isLoading, isError, error, refetch, isFetching } = useApercuPlanningsQuery();
  const aujourdhui = cleAujourdhui();

  if (isError && estRouteAbsente(error)) {
    return <p className="text-sm text-gray-500 py-6 text-center">Choisissez un restaurant.</p>;
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100">
        <h3 className="text-base font-bold text-gray-900">Plannings des restaurants</h3>
      </div>

      {isError && data && (
        <p className="px-5 py-1.5 text-[11px] text-red-600 bg-red-50 border-b border-red-100">
          Connexion perdue, nouvel essai en cours
        </p>
      )}

      {isLoading ? (
        <div className="p-4 space-y-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-10 rounded-lg bg-gray-100 animate-pulse" />
          ))}
        </div>
      ) : isError && !data ? (
        <div className="m-4 flex items-center gap-2 text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>Impossible de lire les plannings.</span>
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="ml-auto shrink-0 text-[#F17922] underline disabled:opacity-50"
          >
            Réessayer
          </button>
        </div>
      ) : !data || data.length === 0 ? (
        <p className="text-sm text-gray-500 py-8 text-center">Aucun restaurant.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-600">
              <tr>
                <th className="text-left font-semibold px-4 py-2">Restaurant</th>
                <th className="text-left font-semibold px-4 py-2">Planning en cours</th>
                <th className="text-left font-semibold px-4 py-2">Réponses</th>
                <th className="text-left font-semibold px-4 py-2">Planning suivant</th>
                <th className="text-left font-semibold px-4 py-2">Aujourd&apos;hui</th>
              </tr>
            </thead>
            <tbody>
              {data.map((ligne) => (
                <LigneApercu
                  key={ligne.restaurant.id}
                  ligne={ligne}
                  aujourdhui={aujourdhui}
                  onChoisir={onChoisir}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function LigneApercu({
  ligne,
  aujourdhui,
  onChoisir,
}: {
  ligne: IApercuPlanning;
  aujourdhui: string;
  onChoisir: (restaurantId: string) => void;
}) {
  const { en_cours, suivant } = ligne;
  const enCours = en_cours ? `${periode(en_cours.debut, en_cours.fin)} · ${LIBELLE_ETAT[en_cours.statut]}` : null;
  const prochain = suivant ? `${periode(suivant.debut, suivant.fin)} · ${LIBELLE_ETAT[suivant.statut]}` : null;
  const reponses = en_cours ? texteReponses(en_cours.reponses) : "";

  return (
    <tr
      onClick={() => onChoisir(ligne.restaurant.id)}
      className="border-t border-gray-100 cursor-pointer hover:bg-orange-50/60"
    >
      <td className="px-4 py-2.5 font-semibold text-gray-900 whitespace-nowrap">{ligne.restaurant.nom}</td>
      <td className="px-4 py-2.5 whitespace-nowrap">
        {enCours ? (
          <span className="text-gray-700">{enCours}</span>
        ) : (
          <span className="font-semibold text-amber-600">Aucun</span>
        )}
      </td>
      <td className="px-4 py-2.5 whitespace-nowrap text-gray-600">{reponses}</td>
      <td className="px-4 py-2.5 whitespace-nowrap">
        {prochain ? (
          <span className="text-gray-700">{prochain}</span>
        ) : (
          <span
            className={`font-semibold ${suivantManquant(ligne, aujourdhui) ? "text-red-600" : "text-gray-400"}`}
          >
            Aucun
          </span>
        )}
      </td>
      <td className="px-4 py-2.5 whitespace-nowrap text-gray-700">{textePrevus(ligne.prevus_aujourdhui)}</td>
    </tr>
  );
}
