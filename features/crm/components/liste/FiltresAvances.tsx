import React from "react";
import { IContactFiltres } from "../../types/contact.type";
import { useRaisonsQuery, useStatutsAppelQuery } from "../../queries/reglage.query";
import { ChampSelect, ChampTexte } from "../commun/Champs";

const TRIS = [
  { value: "entree_desc", label: "Entrés récemment d'abord" },
  { value: "inscription_desc", label: "Inscrits récemment d'abord" },
  { value: "inscription_asc", label: "Inscrits anciens d'abord" },
  { value: "appel_desc", label: "Appelés récemment d'abord" },
  { value: "appel_asc", label: "Appelés il y a longtemps d'abord" },
  { value: "tentatives_desc", label: "Plus de tentatives d'abord" },
  { value: "derniere_commande_desc", label: "Dernière commande récente d'abord" },
  { value: "derniere_commande_asc", label: "Dernière commande ancienne d'abord" },
];

function Case({ label, coche, onChange }: { label: string; coche: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="inline-flex items-center gap-2 text-sm text-gray-700 cursor-pointer select-none">
      <input
        type="checkbox"
        checked={coche}
        onChange={(e) => onChange(e.target.checked)}
        className="w-4 h-4 accent-[#F17922]"
      />
      {label}
    </label>
  );
}

export function FiltresAvances({
  filtres,
  onChange,
}: {
  filtres: IContactFiltres;
  onChange: (partiel: Partial<IContactFiltres>) => void;
}) {
  const { data: raisons = [] } = useRaisonsQuery();
  const { data: statuts = [] } = useStatutsAppelQuery();

  return (
    <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border-t border-gray-100 pt-3">
      <ChampSelect
        label="Coupon"
        valeur={filtres.coupon ?? ""}
        onChange={(v) => onChange({ coupon: (v || undefined) as IContactFiltres["coupon"] })}
        vide="Peu importe"
        options={[
          { value: "AUCUN", label: "Aucun coupon" },
          { value: "ACTIF", label: "Envoyé, non utilisé" },
          { value: "UTILISE", label: "Utilisé" },
          { value: "EXPIRE", label: "Expiré" },
        ]}
      />
      <ChampSelect
        label="Raison de non-commande"
        valeur={filtres.loss_reason_id ?? ""}
        onChange={(v) => onChange({ loss_reason_id: v || undefined })}
        vide="Toutes"
        options={raisons.map((r) => ({ value: r.id, label: r.name }))}
      />
      <ChampSelect
        label="Dernier statut d'appel"
        valeur={filtres.call_status_id ?? ""}
        onChange={(v) => onChange({ call_status_id: v || undefined })}
        vide="Tous"
        options={statuts.map((s) => ({ value: s.id, label: s.label }))}
      />
      <ChampSelect
        label="Trier"
        valeur={filtres.sort ?? "entree_desc"}
        onChange={(v) => onChange({ sort: v as IContactFiltres["sort"] })}
        options={TRIS}
      />
      <div className="grid grid-cols-2 gap-2">
        <ChampTexte label="Inscrit du" type="date" valeur={filtres.registered_from ?? ""} onChange={(v) => onChange({ registered_from: v || undefined })} />
        <ChampTexte label="au" type="date" valeur={filtres.registered_to ?? ""} onChange={(v) => onChange({ registered_to: v || undefined })} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <ChampTexte label="Dernier appel du" type="date" valeur={filtres.last_call_from ?? ""} onChange={(v) => onChange({ last_call_from: v || undefined })} />
        <ChampTexte label="au" type="date" valeur={filtres.last_call_to ?? ""} onChange={(v) => onChange({ last_call_to: v || undefined })} />
      </div>
      <div className="flex flex-col justify-end gap-2 lg:col-span-2 pb-1">
        <Case
          label="Jamais appelés"
          coche={filtres.never_called === "true"}
          onChange={(v) => onChange({ never_called: v ? "true" : undefined })}
        />
        <Case
          label="Ont abandonné un paiement en ligne"
          coche={filtres.abandoned === "true"}
          onChange={(v) => onChange({ abandoned: v ? "true" : undefined })}
        />
      </div>
    </div>
  );
}
