import React from "react";
import { useAgentsQuery } from "../../queries/contact.query";
import { useOffresQuery } from "../../queries/reglage.query";
import { Public } from "../../types/contact.type";
import { PUBLICS, PUBLIC_META } from "../../utils/crm-ui";
import { ChampSelect, ChampTexte, Libelle, classeChamp } from "../commun/Champs";
import { ChoixEquipe } from "./ChoixEquipe";

export interface EtatForm {
  name: string;
  description: string;
  start_date: string;
  fin: "date" | "duree";
  end_date: string;
  duration_days: string;
  target_conversion_rate: string;
  target_contacts_count: string;
  lead_agent_id: string;
  agent_ids: string[];
  offer_id: string;
  distribution_mode: "AUTOMATIQUE" | "MANUEL";
  segments: Public[];
  population: "tous" | "periode";
  registered_from: string;
  registered_to: string;
}

/** Champs du formulaire ; une campagne lancée ne change plus que son nom, sa fin, ses objectifs et son offre. */
export function ChampsCampagne({ f, maj, lancee }: { f: EtatForm; maj: (p: Partial<EtatForm>) => void; lancee: boolean }) {
  const { data: agents = [] } = useAgentsQuery();
  const { data: offres = [] } = useOffresQuery();

  return (
    <div className="space-y-4">
      <ChampTexte label="Nom" requis valeur={f.name} onChange={(v) => maj({ name: v })} placeholder="Relance contacts octobre 2026" />
      <label className="block">
        <Libelle>Description et objectif</Libelle>
        <textarea value={f.description} onChange={(e) => maj({ description: e.target.value })} rows={2} className={`${classeChamp} resize-none`} />
      </label>

      <div className="grid sm:grid-cols-3 gap-3">
        <fieldset disabled={lancee}>
          <ChampTexte label="Début" requis type="date" valeur={f.start_date} onChange={(v) => maj({ start_date: v })} />
        </fieldset>
        <ChampSelect label="Fin" valeur={f.fin} onChange={(v) => maj({ fin: v as EtatForm["fin"] })} options={[{ value: "date", label: "À une date" }, { value: "duree", label: "Après N jours" }]} />
        {f.fin === "date" ? (
          <ChampTexte label="Date de fin" type="date" valeur={f.end_date} onChange={(v) => maj({ end_date: v })} min={f.start_date} />
        ) : (
          <ChampTexte label="Nombre de jours" type="number" valeur={f.duration_days} onChange={(v) => maj({ duration_days: v })} min={1} />
        )}
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <ChampTexte label="Taux de conversion visé (%)" type="number" valeur={f.target_conversion_rate} onChange={(v) => maj({ target_conversion_rate: v })} min={0} max={100} />
        <ChampTexte label="Contacts à traiter" type="number" valeur={f.target_contacts_count} onChange={(v) => maj({ target_contacts_count: v })} min={1} />
      </div>

      <fieldset disabled={lancee} className="space-y-3 disabled:opacity-60">
        <div>
          <Libelle requis>Publics visés</Libelle>
          <div className="grid sm:grid-cols-2 gap-2">
            {PUBLICS.map((p) => (
              <label key={p} className={`flex items-start gap-2 rounded-lg border px-3 py-2 cursor-pointer text-sm ${f.segments.includes(p) ? "border-[#F17922] bg-orange-50" : "border-gray-200"}`}>
                <input
                  type="checkbox"
                  checked={f.segments.includes(p)}
                  onChange={() => maj({ segments: f.segments.includes(p) ? f.segments.filter((s) => s !== p) : [...f.segments, p] })}
                  className="mt-0.5 w-4 h-4 accent-[#F17922]"
                />
                <span>
                  <span className="block font-semibold text-gray-800">{PUBLIC_META[p].label}</span>
                  <span className="block text-xs text-gray-500">{PUBLIC_META[p].aide}</span>
                </span>
              </label>
            ))}
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <ChampSelect
            label="Population"
            valeur={f.population}
            onChange={(v) => maj({ population: v as EtatForm["population"] })}
            options={[{ value: "tous", label: "Tous les contacts actifs au lancement" }, { value: "periode", label: "Inscrits sur une période" }]}
          />
          <ChampSelect
            label="Répartition"
            valeur={f.distribution_mode}
            onChange={(v) => maj({ distribution_mode: v as EtatForm["distribution_mode"] })}
            options={[{ value: "AUTOMATIQUE", label: "Automatique et équilibrée" }, { value: "MANUEL", label: "Manuelle, par le pilote" }]}
          />
        </div>
        {f.population === "periode" && (
          <div className="grid grid-cols-2 gap-3">
            <ChampTexte label="Inscrits du" type="date" valeur={f.registered_from} onChange={(v) => maj({ registered_from: v })} />
            <ChampTexte label="au" type="date" valeur={f.registered_to} onChange={(v) => maj({ registered_to: v })} />
          </div>
        )}
        <ChampSelect label="Pilote" requis valeur={f.lead_agent_id} onChange={(v) => maj({ lead_agent_id: v })} vide="Choisir…" options={agents.map((a) => ({ value: a.id, label: a.fullname }))} />
        <ChoixEquipe choisis={f.agent_ids} onChange={(ids) => maj({ agent_ids: ids })} />
      </fieldset>

      <ChampSelect
        label="Offre des coupons"
        valeur={f.offer_id}
        onChange={(v) => maj({ offer_id: v })}
        vide="Offre par défaut"
        options={offres.filter((o) => o.is_active).map((o) => ({ value: o.id, label: o.label }))}
      />
    </div>
  );
}
