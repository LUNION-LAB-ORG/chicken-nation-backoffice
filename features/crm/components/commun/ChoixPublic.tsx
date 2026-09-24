import React from "react";
import { Public } from "../../types/contact.type";
import { PUBLICS, PUBLIC_META } from "../../utils/crm-ui";
import { ChampSelect } from "./Champs";

/** Filtre « public » des tableaux de bord : tous, ou un seul public du CRM. */
export function ChoixPublic({ valeur, onChange }: { valeur?: Public; onChange: (p: Public | undefined) => void }) {
  return (
    <div className="w-56">
      <ChampSelect
        valeur={valeur ?? ""}
        onChange={(v) => onChange((v || undefined) as Public | undefined)}
        vide="Tous les publics"
        options={PUBLICS.map((p) => ({ value: p, label: PUBLIC_META[p].label }))}
      />
    </div>
  );
}
