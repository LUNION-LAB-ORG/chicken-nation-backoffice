import React, { useState } from "react";
import { UserCog } from "lucide-react";
import { useAgentsQuery } from "../../queries/prospect.query";
import { useAssignerMutation } from "../../queries/prospect.mutation";
import { IProspectFiche } from "../../types/prospect.type";
import { Bouton, ChampSelect } from "../commun/Champs";
import { EtatRequete } from "../commun/Etats";

/** Affectation à l'unité (cahier §4.3), pour la direction et le pilote de la campagne. */
export function PanneauAgent({ p }: { p: IProspectFiche }) {
  const requete = useAgentsQuery();
  const agents = requete.data ?? [];
  const assigner = useAssignerMutation();
  const [agentId, setAgentId] = useState(p.assigned_to_id ?? "");

  const change = agentId !== (p.assigned_to_id ?? "");

  return (
    <div className="space-y-3">
      <p className="flex items-center gap-2 text-sm font-semibold text-gray-800">
        <UserCog className="w-4 h-4 text-[#F17922]" /> Agent en charge
      </p>
      <EtatRequete requete={requete}>
        <ChampSelect
          valeur={agentId}
          onChange={setAgentId}
          vide="Sans agent"
          options={agents.map((a) => ({ value: a.id, label: `${a.fullname} (${a.portefeuille} en cours)` }))}
        />
        <Bouton
          className="w-full"
          desactive={!change || assigner.isPending}
          onClick={() => assigner.mutate({ prospect_ids: [p.id], agent_id: agentId || null })}
        >
          {!agentId && p.assigned_to_id ? "Retirer l'agent" : "Confier à cet agent"}
        </Bouton>
      </EtatRequete>
    </div>
  );
}
