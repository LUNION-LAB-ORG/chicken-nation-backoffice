import React from "react";
import { Loader2, UserCheck } from "lucide-react";
import { useAssignerIncidentMutation, usePrendreIncidentMutation } from "../../queries/incident.mutation";
import { useAgentsIncidentsQuery } from "../../queries/incident.query";
import type { IncidentFiche, IncidentPole } from "../../types/incident.types";
import { LIBELLE_POLE, POLES } from "../../utils/incident";
import { classeChamp } from "../Elements";

/**
 * Qui répond de l'incident. Le responsable vient de la catégorie ; le siège
 * peut le changer ou nommer un agent, et qui traite l'incident le prend en
 * charge d'un clic (En cours, à son nom).
 */
export function Responsable({ incident }: { incident: IncidentFiche }) {
  const { droits } = incident;
  const prendre = usePrendreIncidentMutation();
  const assigner = useAssignerIncidentMutation();
  const { data: agents } = useAgentsIncidentsQuery(droits.assigner);
  const occupe = prendre.isPending || assigner.isPending;

  // L'agent actuel reste dans la liste même s'il n'est pas du siège (un manager qui a pris l'incident).
  const options = [...(agents ?? [])];
  if (incident.agent && !options.some((a) => a.id === incident.agent!.id)) {
    options.push({ id: incident.agent.id, fullname: incident.agent.fullname, role: "" });
  }

  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      {droits.assigner ? (
        <div className="flex flex-wrap items-end gap-3">
          <label className="flex min-w-[160px] flex-col gap-1.5">
            <span className="text-xs font-semibold text-gray-600">Responsable</span>
            <select
              value={incident.pole}
              disabled={occupe}
              onChange={(e) =>
                assigner.mutate({ id: incident.id, valeur: { statut_lu: incident.statut, pole: e.target.value as IncidentPole } })
              }
              className={`${classeChamp} cursor-pointer`}
            >
              {POLES.map((p) => (
                <option key={p} value={p}>
                  {LIBELLE_POLE[p]}
                </option>
              ))}
            </select>
          </label>
          <label className="flex min-w-[200px] flex-col gap-1.5">
            <span className="text-xs font-semibold text-gray-600">Suivi par</span>
            <select
              value={incident.agent?.id ?? ""}
              disabled={occupe}
              onChange={(e) =>
                assigner.mutate({ id: incident.id, valeur: { statut_lu: incident.statut, agent_id: e.target.value || null } })
              }
              className={`${classeChamp} cursor-pointer`}
            >
              <option value="">Personne</option>
              {options.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.fullname}
                </option>
              ))}
            </select>
          </label>
        </div>
      ) : (
        <p className="text-[13px] text-gray-600">
          Responsable : <span className="font-semibold text-gray-900">{LIBELLE_POLE[incident.pole]}</span>
          {" · "}
          {incident.agent ? (
            <>
              suivi par <span className="font-semibold text-gray-900">{incident.agent.fullname}</span>
            </>
          ) : (
            "personne ne l'a encore pris"
          )}
        </p>
      )}

      {droits.prendre && (
        <button
          type="button"
          disabled={occupe}
          onClick={() => prendre.mutate({ id: incident.id, valeur: { statut_lu: incident.statut } })}
          className="inline-flex h-10 items-center gap-2 rounded-lg border border-[#F17922] bg-white px-4 text-sm font-semibold text-[#F17922] hover:bg-orange-50 disabled:opacity-50"
        >
          {prendre.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserCheck className="h-4 w-4" />}
          Prendre en charge
        </button>
      )}
    </div>
  );
}
