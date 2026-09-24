import React, { useState } from "react";
import { toast } from "react-hot-toast";
import Modal from "@/components/ui/Modal";
import { useEnregistrerCampagneMutation } from "../../queries/campagne.query";
import { campagneSchema } from "../../schemas/campagne.schema";
import { ICampagne, ICampagneDTO } from "../../types/campagne.type";
import { aujourdhuiISO } from "../../utils/crm-ui";
import { Bouton } from "../commun/Champs";
import { ChampsCampagne, EtatForm } from "./ChampsCampagne";

const jour = (v?: string | null) => (v ? v.slice(0, 10) : "");
const nombre = (v: string) => (v.trim() === "" ? undefined : Number(v));

function etatInitial(c?: ICampagne | null): EtatForm {
  return {
    name: c?.name ?? "",
    description: c?.description ?? "",
    start_date: jour(c?.start_date) || aujourdhuiISO(),
    fin: "date",
    end_date: jour(c?.end_date),
    duration_days: "15",
    target_conversion_rate: c?.target_conversion_rate?.toString() ?? "",
    target_contacts_count: c?.target_contacts_count?.toString() ?? "",
    lead_agent_id: c?.lead_agent.id ?? "",
    agent_ids: c?.assigned_agents.map((a) => a.agent.id) ?? [],
    offer_id: c?.offer?.id ?? "",
    distribution_mode: c?.distribution_mode ?? "AUTOMATIQUE",
    segments: c?.segments ?? ["JAMAIS_COMMANDE"],
    population: c?.registered_from || c?.registered_to ? "periode" : "tous",
    registered_from: jour(c?.registered_from),
    registered_to: jour(c?.registered_to),
  };
}

/** Création et modification d'une campagne (cahier §6.1). */
export function FormCampagne({ ouvert, campagne, onFermer }: { ouvert: boolean; campagne?: ICampagne | null; onFermer: () => void }) {
  const [f, setF] = useState<EtatForm>(() => etatInitial(campagne));
  const enregistrer = useEnregistrerCampagneMutation();
  const lancee = !!campagne && campagne.status !== "PLANIFIED";
  const maj = (p: Partial<EtatForm>) => setF((e) => ({ ...e, ...p }));

  const valider = () => {
    const brut = {
      name: f.name,
      description: f.description.trim() || undefined,
      start_date: f.start_date,
      end_date: f.fin === "date" && f.end_date ? f.end_date : undefined,
      duration_days: f.fin === "duree" ? nombre(f.duration_days) : undefined,
      target_conversion_rate: nombre(f.target_conversion_rate),
      target_contacts_count: nombre(f.target_contacts_count),
      lead_agent_id: f.lead_agent_id,
      agent_ids: f.agent_ids,
      offer_id: f.offer_id || undefined,
      distribution_mode: f.distribution_mode,
      segments: f.segments,
      registered_from: f.population === "periode" && f.registered_from ? f.registered_from : undefined,
      registered_to: f.population === "periode" && f.registered_to ? f.registered_to : undefined,
    };
    const r = campagneSchema.safeParse(brut);
    if (!r.success) return toast.error(r.error.issues[0].message);
    const dto: Partial<ICampagneDTO> = lancee
      ? {
          name: r.data.name,
          description: r.data.description ?? "",
          end_date: r.data.end_date,
          duration_days: r.data.duration_days,
          target_conversion_rate: r.data.target_conversion_rate,
          target_contacts_count: r.data.target_contacts_count,
          offer_id: r.data.offer_id,
        }
      : r.data;
    enregistrer.mutate({ id: campagne?.id, dto: dto as ICampagneDTO }, { onSuccess: onFermer });
  };

  return (
    <Modal isOpen={ouvert} onClose={onFermer} title={campagne ? "Modifier la campagne" : "Nouvelle campagne"} size="large">
      <ChampsCampagne f={f} maj={maj} lancee={lancee} />
      <div className="flex justify-end gap-2 mt-6">
        <Bouton onClick={onFermer}>Annuler</Bouton>
        <Bouton variante="primaire" onClick={valider} desactive={enregistrer.isPending}>
          {campagne ? "Enregistrer" : "Créer la campagne"}
        </Bouton>
      </div>
    </Modal>
  );
}
