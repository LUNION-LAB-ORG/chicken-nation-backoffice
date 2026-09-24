import React, { useState } from "react";
import { Shuffle } from "lucide-react";
import Modal from "@/components/ui/Modal";
import { useAgentsQuery } from "../../queries/contact.query";
import { useDistribuerMutation, useEquipeMutation } from "../../queries/campagne.query";
import { ICampagne } from "../../types/campagne.type";
import { Bouton, ChampSelect } from "../commun/Champs";
import { ChoixEquipe } from "./ChoixEquipe";

/**
 * Le pilote gère son équipe (cahier §9) : ajouter ou retirer un agent, puis
 * rééquilibrer. Seule la direction change le pilote.
 */
export function EquipeCampagne({
  c,
  ouvert,
  onFermer,
  estGestionnaire,
}: {
  c: ICampagne;
  ouvert: boolean;
  onFermer: () => void;
  estGestionnaire: boolean;
}) {
  const [agents, setAgents] = useState(c.assigned_agents.map((a) => a.agent.id));
  const [pilote, setPilote] = useState(c.lead_agent.id);
  const [inclure, setInclure] = useState(false);
  const { data: tous = [] } = useAgentsQuery();
  const equipe = useEquipeMutation();
  const distribuer = useDistribuerMutation();
  const enCours = c.status === "ACTIVE" || c.status === "SUSPENDED";

  return (
    <Modal isOpen={ouvert} onClose={onFermer} title={`Équipe : ${c.name}`}>
      <div className="space-y-4">
        {estGestionnaire && (
          <ChampSelect label="Pilote" valeur={pilote} onChange={setPilote} options={tous.map((a) => ({ value: a.id, label: a.fullname }))} />
        )}
        <ChoixEquipe choisis={agents} onChange={setAgents} />
        <p className="text-xs text-gray-500">
          Un agent retiré rend ses contacts. En répartition automatique, ils sont aussitôt confiés aux autres agents.
        </p>
        <div className="flex justify-end">
          <Bouton
            variante="primaire"
            desactive={agents.length === 0 || equipe.isPending}
            onClick={() =>
              equipe.mutate(
                { id: c.id, agentIds: agents, piloteId: pilote !== c.lead_agent.id ? pilote : undefined },
                { onSuccess: onFermer },
              )
            }
          >
            Enregistrer l&apos;équipe
          </Bouton>
        </div>

        {enCours && (
          <div className="border-t border-gray-100 pt-4 space-y-3">
            <p className="text-sm font-semibold text-gray-800">Répartir les contacts</p>
            <label className="flex items-start gap-2 text-sm text-gray-700 cursor-pointer">
              <input type="checkbox" checked={inclure} onChange={(e) => setInclure(e.target.checked)} className="mt-0.5 w-4 h-4 accent-[#F17922]" />
              Rééquilibrer aussi les contacts déjà confiés mais jamais appelés
            </label>
            <Bouton
              desactive={distribuer.isPending}
              onClick={() => distribuer.mutate({ id: c.id, inclureNonAppeles: inclure })}
            >
              <Shuffle className="w-4 h-4" /> Répartir équitablement
            </Bouton>
          </div>
        )}
      </div>
    </Modal>
  );
}
