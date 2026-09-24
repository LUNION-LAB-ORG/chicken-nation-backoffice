import React, { useState } from "react";
import { toast } from "react-hot-toast";
import Modal from "@/components/ui/Modal";
import { useListeMutation } from "../../queries/reglage.query";
import { offreSchema } from "../../schemas/reglage.schema";
import { IOffre, TypeRemise } from "../../types/reglage.type";
import { Bouton, ChampSelect, ChampTexte } from "../commun/Champs";

const texte = (n?: number | null) => (n == null ? "" : String(n));
const nombre = (v: string) => (v.trim() === "" ? undefined : Number(v));

export function FormOffre({ offre, onFermer }: { offre: IOffre | null; onFermer: () => void }) {
  const liste = useListeMutation("offres");
  const [label, setLabel] = useState(offre?.label ?? "");
  const [type, setType] = useState<TypeRemise>(offre?.discount_type ?? "PERCENTAGE");
  const [valeur, setValeur] = useState(texte(offre?.discount_value));
  const [plafond, setPlafond] = useState(texte(offre?.max_discount_amount));
  const [minimum, setMinimum] = useState(texte(offre?.min_order_amount));
  const [jours, setJours] = useState(texte(offre?.validity_days ?? 7));

  const enregistrer = () => {
    const r = offreSchema.safeParse({
      label,
      discount_type: type,
      discount_value: nombre(valeur),
      max_discount_amount: nombre(plafond),
      min_order_amount: nombre(minimum),
      validity_days: nombre(jours),
    });
    if (!r.success) return toast.error(r.error.issues[0].message);
    liste.mutate(offre ? { type: "modifier", id: offre.id, dto: r.data } : { type: "ajouter", dto: r.data }, { onSuccess: onFermer });
  };

  return (
    <Modal isOpen onClose={onFermer} title={offre ? "Modifier l'offre" : "Nouvelle offre"}>
      <div className="space-y-3">
        <ChampTexte label="Libellé lu au client" requis valeur={label} onChange={setLabel} placeholder="15 % sur la première commande" />
        <div className="grid grid-cols-2 gap-3">
          <ChampSelect
            label="Type de remise"
            valeur={type}
            onChange={(v) => setType(v as TypeRemise)}
            options={[
              { value: "PERCENTAGE", label: "Pourcentage" },
              { value: "FIXED_AMOUNT", label: "Montant fixe (F)" },
            ]}
          />
          <ChampTexte label={type === "PERCENTAGE" ? "Remise (%)" : "Remise (F)"} requis type="number" valeur={valeur} onChange={setValeur} min={1} />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <ChampTexte label="Validité (jours)" requis type="number" valeur={jours} onChange={setJours} min={1} max={90} />
          <ChampTexte label="Commande minimum (F)" type="number" valeur={minimum} onChange={setMinimum} min={0} />
          <ChampTexte label="Plafond de remise (F)" type="number" valeur={plafond} onChange={setPlafond} min={0} />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Bouton onClick={onFermer}>Annuler</Bouton>
          <Bouton variante="primaire" onClick={enregistrer} desactive={liste.isPending}>
            Enregistrer
          </Bouton>
        </div>
      </div>
    </Modal>
  );
}
