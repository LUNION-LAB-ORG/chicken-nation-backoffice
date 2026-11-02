import React from "react";
import type { AvisLigne } from "../../types/avis-prive.types";
import {
  formatEcheance,
  formatRecu,
  JE_NE_SAIS_PAS,
  LIBELLE_CANAL,
  nomAffiche,
  NON_ASSIGNE,
  telephoneLocal,
} from "../../utils/avis-prive";
import { PastilleRessenti, PastilleStatut, Rapprochement } from "./Elements";

const ENTETES = ["Reçu le", "Ressenti", "Client", "Store · canal", "Commentaire", "Statut", "Échéance", "Agent"];

/** Tableau des retours privés : toute la ligne ouvre la fiche. */
export function TableRetours({ lignes, onOuvrir }: { lignes: AvisLigne[]; onOuvrir: (id: string) => void }) {
  const maintenant = new Date();
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-100 bg-white">
      <table className="w-full min-w-[980px] border-collapse text-[13.5px]">
        <thead>
          <tr className="border-b border-slate-100 text-left text-xs text-gray-500">
            {ENTETES.map((e) => (
              <th key={e} className="px-3.5 py-3 font-semibold">
                {e}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {lignes.map((a) => {
            const echeance = formatEcheance(a.echeance_at, a.en_retard, maintenant);
            return (
              <tr
                key={a.id}
                tabIndex={0}
                onClick={() => onOuvrir(a.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onOuvrir(a.id);
                  }
                }}
                className="cursor-pointer border-b border-slate-50 align-top transition-colors last:border-0 hover:bg-orange-50/40 focus:bg-orange-50/40 focus:outline-none"
              >
                <td className="whitespace-nowrap px-3.5 py-3 text-gray-800">{formatRecu(a.created_at)}</td>
                <td className="px-3.5 py-3">
                  <PastilleRessenti ressenti={a.ressenti} />
                </td>
                <td className="whitespace-nowrap px-3.5 py-3">
                  <div className="font-semibold text-gray-900">{nomAffiche(a.prenom)}</div>
                  <div className="text-gray-500">{telephoneLocal(a.telephone)}</div>
                  <Rapprochement rapproche={a.rapproche} />
                </td>
                <td className="whitespace-nowrap px-3.5 py-3 text-gray-800">
                  {a.restaurant?.name ?? JE_NE_SAIS_PAS}
                  <div className="text-gray-500">{LIBELLE_CANAL[a.canal]}</div>
                </td>
                <td className="max-w-[280px] px-3.5 py-3 text-gray-800">{a.commentaire_extrait}</td>
                <td className="whitespace-nowrap px-3.5 py-3">
                  <PastilleStatut statut={a.statut} />
                </td>
                <td
                  className={`whitespace-nowrap px-3.5 py-3 ${echeance.depassee ? "font-bold text-[#9A3412]" : "text-gray-700"}`}
                >
                  {echeance.texte}
                </td>
                <td className="whitespace-nowrap px-3.5 py-3 text-gray-800">{a.agent?.fullname ?? NON_ASSIGNE}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
