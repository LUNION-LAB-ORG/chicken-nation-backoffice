import React, { useRef } from "react";
import { useAgentsQuery } from "../../queries/contact.query";
import { useOffresQuery } from "../../queries/reglage.query";
import { Public } from "../../types/contact.type";
import { PUBLICS, PUBLIC_META } from "../../utils/crm-ui";
import { ChampSelect, ChampTexte, Libelle, classeChamp } from "../commun/Champs";
import { ApercuPopulation } from "./ApercuPopulation";
import { ChoixEquipe } from "./ChoixEquipe";
import { CriteresPublic } from "./CriteresPublic";
import { EtatForm, EtatPublic, criteresSaisis, nouveauPublic, trier } from "./etat-campagne";

export type { EtatForm } from "./etat-campagne";

/**
 * Champs du formulaire. Une campagne lancée ne change plus que son nom, sa
 * fin, ses objectifs et ses offres (celle de la campagne et celle de chaque
 * public) ; ses publics et leurs critères sont figés.
 */
export function ChampsCampagne({ f, maj, lancee }: { f: EtatForm; maj: (p: Partial<EtatForm>) => void; lancee: boolean }) {
  const { data: agents = [] } = useAgentsQuery();
  const { data: offres = [] } = useOffresQuery();
  // Un public décoché puis recoché retrouve ses critères.
  const memoire = useRef<Partial<Record<Public, EtatPublic>>>({});

  const basculer = (segment: Public) => {
    const actuel = f.publics.find((p) => p.segment === segment);
    if (actuel) {
      memoire.current[segment] = actuel;
      maj({ publics: f.publics.filter((p) => p.segment !== segment) });
    } else {
      maj({ publics: trier([...f.publics, memoire.current[segment] ?? nouveauPublic(segment)]) });
    }
  };
  const majPublic = (segment: Public, patch: Partial<EtatPublic>) =>
    maj({ publics: f.publics.map((p) => (p.segment === segment ? { ...p, ...patch } : p)) });

  const visibles = lancee ? PUBLICS.filter((s) => f.publics.some((p) => p.segment === s)) : PUBLICS;

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

      <div>
        <div className="grid sm:grid-cols-2 gap-3">
          <ChampTexte label="Taux de conversion visé (%)" type="number" valeur={f.target_conversion_rate} onChange={(v) => maj({ target_conversion_rate: v })} min={0} max={100} />
          <ChampTexte label="Contacts à joindre" type="number" valeur={f.target_contacts_count} onChange={(v) => maj({ target_contacts_count: v })} min={1} />
        </div>
        <p className="text-xs text-gray-500 mt-1">Objectifs de toute la campagne. Chaque public peut avoir les siens.</p>
      </div>

      <div>
        <Libelle requis>Publics visés</Libelle>
        <div className="space-y-2">
          {visibles.map((segment) => {
            const choisi = f.publics.find((p) => p.segment === segment);
            const meta = PUBLIC_META[segment];
            return (
              <div
                key={segment}
                className={`rounded-lg border px-3 py-2 ${choisi ? "border-[#F17922] bg-orange-50/60" : "border-gray-200 bg-white"}`}
              >
                <label className={`flex items-start gap-2 text-sm ${lancee ? "" : "cursor-pointer"}`}>
                  <input
                    type="checkbox"
                    checked={!!choisi}
                    disabled={lancee}
                    onChange={() => basculer(segment)}
                    className="mt-0.5 w-4 h-4 accent-[#F17922]"
                  />
                  <span>
                    <span className="block font-semibold text-gray-800">{meta.label}</span>
                    <span className="block text-xs text-gray-500">{meta.aide}</span>
                  </span>
                </label>
                {choisi && (
                  <CriteresPublic p={choisi} maj={(patch) => majPublic(segment, patch)} figes={lancee} offres={offres} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      <fieldset disabled={lancee} className="space-y-3 disabled:opacity-60">
        <div className="grid sm:grid-cols-2 gap-3">
          <ChampSelect
            label="Répartition"
            valeur={f.distribution_mode}
            onChange={(v) => maj({ distribution_mode: v as EtatForm["distribution_mode"] })}
            options={[{ value: "AUTOMATIQUE", label: "Automatique et équilibrée" }, { value: "MANUEL", label: "Manuelle, par le pilote" }]}
          />
          <ChampSelect label="Pilote" requis valeur={f.lead_agent_id} onChange={(v) => maj({ lead_agent_id: v })} vide="Choisir…" options={agents.map((a) => ({ value: a.id, label: a.fullname }))} />
        </div>
        <ChoixEquipe choisis={f.agent_ids} onChange={(ids) => maj({ agent_ids: ids })} />
      </fieldset>

      <ChampSelect
        label="Offre des coupons"
        valeur={f.offer_id}
        onChange={(v) => maj({ offer_id: v })}
        vide="Offre par défaut"
        options={offres.filter((o) => o.is_active || o.id === f.offer_id).map((o) => ({ value: o.id, label: o.label }))}
      />

      {!lancee && (
        <ApercuPopulation preparer={() => ({ publics: f.publics.map(criteresSaisis), agent_ids: f.agent_ids })} />
      )}
    </div>
  );
}
