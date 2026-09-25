import React, { useState } from "react";
import { toast } from "react-hot-toast";
import Modal from "@/components/ui/Modal";
import { useEnregistrerCampagneMutation } from "../../queries/campagne.query";
import { campagneSchema } from "../../schemas/campagne.schema";
import { ICampagne, ICampagneDTO } from "../../types/campagne.type";
import { Bouton } from "../commun/Champs";
import { ChampsCampagne } from "./ChampsCampagne";
import { EtatForm, etatInitial, publicSaisi, versNombre } from "./etat-campagne";

/** Création et modification d'une campagne (cahier §6.1, lot 3 : publics et critères). */
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
      duration_days: f.fin === "duree" ? versNombre(f.duration_days) : undefined,
      target_conversion_rate: versNombre(f.target_conversion_rate),
      target_contacts_count: versNombre(f.target_contacts_count),
      lead_agent_id: f.lead_agent_id,
      agent_ids: f.agent_ids,
      offer_id: f.offer_id || undefined,
      distribution_mode: f.distribution_mode,
      publics: f.publics.map((p) => publicSaisi(p, lancee)),
    };
    const r = campagneSchema.safeParse(brut);
    if (!r.success) return toast.error(r.error.issues[0].message);
    const v = r.data;

    // En modification, un champ vidé efface la valeur (null) au lieu de la laisser telle quelle.
    const effacable = <T,>(x: T | null | undefined) => (campagne ? (x ?? null) : (x ?? undefined));
    // Une offre inchangée ne repart pas : le serveur refuserait une offre désactivée depuis
    // (« Offre inconnue ou désactivée ») alors que personne n'y a touché.
    const offreGlobaleInchangee = !!campagne && (v.offer_id ?? null) === (campagne.offer?.id ?? null);
    const publics = lancee
      ? brut.publics.map((p) => {
          const actuel = campagne?.publics?.find((x) => x.segment === p.segment);
          const inchangee = !!actuel && (p.offer_id ?? null) === (actuel.offer_id ?? actuel.offer?.id ?? null);
          return inchangee ? { ...p, offer_id: undefined } : p;
        })
      : brut.publics;
    const communs = {
      name: v.name,
      end_date: v.end_date,
      duration_days: v.duration_days,
      target_conversion_rate: effacable(v.target_conversion_rate),
      target_contacts_count: effacable(v.target_contacts_count),
      offer_id: offreGlobaleInchangee ? undefined : effacable(v.offer_id),
      publics,
    };
    const dto: Partial<ICampagneDTO> = lancee
      ? // Campagne lancée : ni début, ni équipe, ni mode de répartition ; des publics, l'offre et les objectifs seulement.
        { ...communs, description: v.description ?? "" }
      : {
          ...communs,
          description: campagne ? (v.description ?? "") : v.description,
          start_date: v.start_date,
          lead_agent_id: v.lead_agent_id,
          agent_ids: v.agent_ids,
          distribution_mode: v.distribution_mode,
        };
    enregistrer.mutate({ id: campagne?.id, dto }, { onSuccess: onFermer });
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
