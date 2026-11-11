"use client";

import React, { useState } from "react";
import { Loader2, Plus } from "lucide-react";
import {
  useCreerCategorieIncidentMutation,
  useEnregistrerReglagesIncidentsMutation,
  useModifierCategorieIncidentMutation,
} from "../queries/incident.mutation";
import { useReglagesIncidentsQuery } from "../queries/incident.query";
import type { CategorieIncident, IncidentPole, ReglagesIncident } from "../types/incident.types";
import { GRAVITES, LIBELLE_GRAVITE, LIBELLE_POLE, POLES, messageErreurIncident } from "../utils/incident";
import { Bloc, classeChamp } from "./Elements";

const DELAIS = [12, 24, 48, 72];

const optionsDelai = (actuel: number) => [...new Set([...DELAIS, actuel])].sort((a, b) => a - b);

function ChoixPole({ valeur, onChange, desactive }: { valeur: IncidentPole; onChange: (p: IncidentPole) => void; desactive?: boolean }) {
  return (
    <select value={valeur} disabled={desactive} onChange={(e) => onChange(e.target.value as IncidentPole)} className={`${classeChamp} cursor-pointer`}>
      {POLES.map((p) => (
        <option key={p} value={p}>
          {LIBELLE_POLE[p]}
        </option>
      ))}
    </select>
  );
}

function ChoixDelai({ valeur, onChange, desactive }: { valeur: number; onChange: (n: number) => void; desactive?: boolean }) {
  return (
    <select value={valeur} disabled={desactive} onChange={(e) => onChange(Number(e.target.value))} className={`${classeChamp} cursor-pointer`}>
      {optionsDelai(valeur).map((d) => (
        <option key={d} value={d}>
          {d} h
        </option>
      ))}
    </select>
  );
}

/** Une catégorie : chaque changement est enregistré aussitôt ; le nom, à la sortie du champ. */
function LigneCategorie({ categorie }: { categorie: CategorieIncident }) {
  const modifier = useModifierCategorieIncidentMutation();
  const [nom, setNom] = useState(categorie.nom);
  const enregistrer = (valeur: Partial<{ nom: string; pole: IncidentPole; delai_heures: number; actif: boolean }>) =>
    modifier.mutate({ id: categorie.id, valeur }, { onError: () => setNom(categorie.nom) });

  return (
    <tr className={`border-b border-slate-50 last:border-0 ${categorie.actif ? "" : "opacity-60"}`}>
      <td className="px-3 py-2">
        <input
          value={nom}
          onChange={(e) => setNom(e.target.value)}
          onBlur={() => {
            const propre = nom.trim();
            if (propre && propre !== categorie.nom) enregistrer({ nom: propre });
            else setNom(categorie.nom);
          }}
          maxLength={80}
          disabled={modifier.isPending}
          aria-label="Nom de la catégorie"
          className={classeChamp}
        />
      </td>
      <td className="px-3 py-2">
        <ChoixPole valeur={categorie.pole} onChange={(pole) => enregistrer({ pole })} desactive={modifier.isPending} />
      </td>
      <td className="px-3 py-2">
        <ChoixDelai valeur={categorie.delai_heures} onChange={(delai_heures) => enregistrer({ delai_heures })} desactive={modifier.isPending} />
      </td>
      <td className="px-3 py-2">
        <label className="inline-flex cursor-pointer items-center gap-2 text-[13px] text-gray-700">
          <input
            type="checkbox"
            checked={categorie.actif}
            disabled={modifier.isPending}
            onChange={(e) => enregistrer({ actif: e.target.checked })}
            className="h-4 w-4 accent-[#F17922]"
          />
          Active
        </label>
      </td>
    </tr>
  );
}

function NouvelleCategorie() {
  const creer = useCreerCategorieIncidentMutation();
  const [nom, setNom] = useState("");
  const [pole, setPole] = useState<IncidentPole>("RESTAURANT");
  const [delai, setDelai] = useState(24);
  const pret = nom.trim().length >= 2;

  return (
    <div className="flex flex-wrap items-end gap-3 border-t border-gray-100 pt-3">
      <label className="flex min-w-[200px] flex-1 flex-col gap-1.5">
        <span className="text-xs font-semibold text-gray-600">Nouvelle catégorie</span>
        <input value={nom} onChange={(e) => setNom(e.target.value)} maxLength={80} placeholder="Emballage abîmé" className={classeChamp} />
      </label>
      <label className="flex min-w-[150px] flex-col gap-1.5">
        <span className="text-xs font-semibold text-gray-600">Responsable</span>
        <ChoixPole valeur={pole} onChange={setPole} />
      </label>
      <label className="flex min-w-[100px] flex-col gap-1.5">
        <span className="text-xs font-semibold text-gray-600">Délai</span>
        <ChoixDelai valeur={delai} onChange={setDelai} />
      </label>
      <button
        type="button"
        disabled={!pret || creer.isPending}
        onClick={() => creer.mutate({ nom: nom.trim(), pole, delai_heures: delai }, { onSuccess: () => setNom("") })}
        className="inline-flex h-[38px] items-center gap-2 rounded-lg bg-[#F17922] px-4 text-sm font-semibold text-white hover:bg-[#e06a15] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {creer.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
        Ajouter
      </button>
    </div>
  );
}

/** Barème des bons, validité, droit des restaurants. Monté avec `key` : il repart des valeurs enregistrées. */
function Bons({ reglages }: { reglages: ReglagesIncident }) {
  const enregistrer = useEnregistrerReglagesIncidentsMutation();
  const [bareme, setBareme] = useState({ ...reglages.bareme });
  const [validite, setValidite] = useState(reglages.validite_jours);
  const [restaurant, setRestaurant] = useState(reglages.bon_restaurant);

  const change =
    GRAVITES.some((g) => bareme[g] !== reglages.bareme[g]) || validite !== reglages.validite_jours || restaurant !== reglages.bon_restaurant;
  const valide = GRAVITES.every((g) => Number.isInteger(bareme[g]) && bareme[g] >= 100 && bareme[g] <= 100_000) && validite >= 1 && validite <= 365;

  return (
    <Bloc titre="Bons de réduction">
      <p className="text-[13px] text-gray-600">
        Montant proposé selon la gravité de l&apos;incident. À la résolution, on choisit parmi ces trois montants.
      </p>
      <div className="flex flex-wrap items-end gap-3">
        {GRAVITES.map((g) => (
          <label key={g} className="flex w-36 flex-col gap-1.5">
            <span className="text-xs font-semibold text-gray-600">Gravité {LIBELLE_GRAVITE[g].toLowerCase()} (F)</span>
            <input
              type="number"
              min={100}
              max={100000}
              step={100}
              value={bareme[g]}
              onChange={(e) => setBareme((b) => ({ ...b, [g]: Number(e.target.value) }))}
              className={classeChamp}
            />
          </label>
        ))}
        <label className="flex w-36 flex-col gap-1.5">
          <span className="text-xs font-semibold text-gray-600">Validité (jours)</span>
          <input type="number" min={1} max={365} value={validite} onChange={(e) => setValidite(Number(e.target.value))} className={classeChamp} />
        </label>
      </div>
      <label className="inline-flex cursor-pointer items-center gap-2 text-[13px] text-gray-700">
        <input type="checkbox" checked={restaurant} onChange={(e) => setRestaurant(e.target.checked)} className="h-4 w-4 accent-[#F17922]" />
        Le manager et son assistant peuvent offrir un bon pour un incident de leur restaurant
      </label>
      <div className="flex items-center justify-end gap-3">
        {!valide && <span className="text-xs text-[#B91C1C]">Montants de 100 à 100.000 F, validité de 1 à 365 jours.</span>}
        <button
          type="button"
          disabled={!change || !valide || enregistrer.isPending}
          onClick={() => enregistrer.mutate({ bareme, validite_jours: validite, bon_restaurant: restaurant })}
          className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#F17922] px-4 text-sm font-semibold text-white hover:bg-[#e06a15] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {enregistrer.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          Enregistrer
        </button>
      </div>
    </Bloc>
  );
}

/**
 * RÉGLAGES DES INCIDENTS (administrateur) : les catégories, avec leur
 * responsable et leur délai, et le barème des bons. Une catégorie ne se
 * supprime pas : elle se désactive, les incidents passés gardent la leur.
 * Une nouvelle catégorie sert tout de suite.
 */
export function ReglagesIncidents() {
  const { data, isPending, isError, error } = useReglagesIncidentsQuery();

  if (isPending) {
    return (
      <div className="flex justify-center rounded-xl border border-slate-100 bg-white py-16">
        <Loader2 className="h-6 w-6 animate-spin text-[#F17922]" />
      </div>
    );
  }
  if (isError || !data) {
    return (
      <div className="rounded-xl border border-slate-100 bg-white py-12 text-center text-sm text-red-600">
        {messageErreurIncident(error, "Impossible de lire les réglages.")}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <Bloc titre="Catégories d'incident">
        <p className="text-[13px] text-gray-600">
          Le responsable est prévenu dès qu&apos;un incident de cette catégorie est signalé ; passé le délai, l&apos;incident est en retard.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-[13.5px]">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs text-gray-500">
                <th className="px-3 py-2 font-semibold">Catégorie</th>
                <th className="w-44 px-3 py-2 font-semibold">Responsable</th>
                <th className="w-28 px-3 py-2 font-semibold">Délai</th>
                <th className="w-28 px-3 py-2 font-semibold">État</th>
              </tr>
            </thead>
            <tbody>
              {data.categories.map((c) => (
                <LigneCategorie key={`${c.id}-${c.nom}`} categorie={c} />
              ))}
            </tbody>
          </table>
        </div>
        <NouvelleCategorie />
      </Bloc>

      <Bons key={JSON.stringify([data.bareme, data.validite_jours, data.bon_restaurant])} reglages={data} />
    </div>
  );
}
