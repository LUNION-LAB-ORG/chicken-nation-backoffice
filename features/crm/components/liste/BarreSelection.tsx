import React, { useState } from "react";
import { UserCheck, UserMinus, X } from "lucide-react";
import { useAgentsQuery } from "../../queries/contact.query";
import { useAssignerMutation } from "../../queries/contact.mutation";
import { Bouton, ChampSelect } from "../commun/Champs";

/**
 * Assignation en masse (cahier §4.3). Reste visible en bas de l'écran tant
 * qu'une sélection existe, pour ne pas remonter la page après avoir coché.
 */
export function BarreSelection({ ids, onVider }: { ids: string[]; onVider: () => void }) {
  const [agent, setAgent] = useState("");
  const { data: agents = [] } = useAgentsQuery();
  const assigner = useAssignerMutation();

  if (ids.length === 0) return null;

  const lancer = (agentId: string | null) =>
    assigner.mutate({ contact_ids: ids, agent_id: agentId }, { onSuccess: onVider });

  return (
    <div className="sticky bottom-3 z-20 mt-3">
      <div className="flex flex-wrap items-center gap-3 bg-gray-900 text-white rounded-xl px-4 py-3 shadow-lg">
        <span className="text-sm font-semibold">
          {ids.length} sélectionné{ids.length > 1 ? "s" : ""}
        </span>
        <div className="w-56 text-gray-800">
          <ChampSelect
            valeur={agent}
            onChange={setAgent}
            vide="Choisir un agent"
            options={agents.map((a) => ({ value: a.id, label: `${a.fullname} (${a.portefeuille} en cours)` }))}
          />
        </div>
        <Bouton variante="primaire" desactive={!agent || assigner.isPending} onClick={() => lancer(agent)}>
          <UserCheck className="w-4 h-4" /> Assigner
        </Bouton>
        <Bouton variante="discret" desactive={assigner.isPending} onClick={() => lancer(null)} className="text-white hover:bg-white/10">
          <UserMinus className="w-4 h-4" /> Retirer l&apos;agent
        </Bouton>
        <button type="button" onClick={onVider} className="ml-auto p-1 rounded hover:bg-white/10" aria-label="Vider la sélection">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
