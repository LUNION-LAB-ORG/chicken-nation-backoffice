import React from "react";
import { ArrowLeft } from "lucide-react";
import { ISuiviCampagne } from "../../types/contact.type";
import { accord, compter, fmtNombre } from "../../utils/crm-ui";

/**
 * Le pilote suit sa campagne depuis « Ma file », même s'il n'y a aucun
 * contact à son nom : ce qui reste, chez qui, et ce que personne n'a encore.
 * Les nombres sont ceux de toute l'équipe.
 */
export function SuiviCampagne({ s, onRetour }: { s: ISuiviCampagne; onRetour: () => void }) {
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onRetour}
          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
        >
          <ArrowLeft className="w-4 h-4" /> Tous les dossiers
        </button>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate">{s.nom}</p>
          <p className="text-xs text-gray-500 tabular-nums">
            {compter(s.restants, "contact restant", "contacts restants")}, {fmtNombre(s.sans_agent)} sans agent
          </p>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs text-gray-500">
            <tr>
              <th className="text-left font-semibold px-4 py-2">Agent</th>
              <th className="text-right font-semibold px-4 py-2">Restants</th>
              <th className="text-right font-semibold px-4 py-2">Jamais appelés</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 tabular-nums">
            {s.par_agent.map((a) => (
              <tr key={a.agent_id}>
                <td className="px-4 py-2 text-gray-900">{a.nom}</td>
                <td className="px-4 py-2 text-right text-gray-900">{fmtNombre(a.restants)}</td>
                <td className="px-4 py-2 text-right text-gray-600">{fmtNombre(a.jamais_appeles)}</td>
              </tr>
            ))}
            {s.sans_agent > 0 && (
              <tr className="bg-orange-50/60">
                <td className="px-4 py-2 font-semibold text-[#8A4B00]">Sans agent</td>
                <td className="px-4 py-2 text-right font-semibold text-[#8A4B00]">{fmtNombre(s.sans_agent)}</td>
                <td className="px-4 py-2 text-right text-gray-400" />
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {s.sans_agent > 0 && (
        <p className="text-sm text-gray-600">
          {accord(s.sans_agent, "Répartissez-le", "Répartissez-les")} depuis l&apos;onglet Campagnes, bouton « Équipe ».
        </p>
      )}
    </div>
  );
}
