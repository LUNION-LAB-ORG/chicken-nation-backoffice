"use client";

import React, { useState } from "react";
import { Loader2 } from "lucide-react";
import { BarresRepartition } from "../../crm/components/commun/BarresRepartition";
import { useStatistiquesIncidentsQuery } from "../queries/incident.query";
import type { StatistiquesIncidents } from "../types/incident.types";
import {
  LIBELLE_GESTE,
  LIBELLE_ORIGINE,
  LIBELLE_POLE,
  dureeEnMots,
  formatJour,
  formatMontant,
  messageErreurIncident,
} from "../utils/incident";
import { Bloc, classeChamp } from "./Elements";
import { FiltreRestaurant } from "./FiltresIncidents";

type Preset = "7" | "30" | "90" | "libre";

const PRESETS: { cle: Preset; libelle: string }[] = [
  { cle: "7", libelle: "7 jours" },
  { cle: "30", libelle: "30 jours" },
  { cle: "90", libelle: "90 jours" },
  { cle: "libre", libelle: "Période" },
];

const jourISO = (ilYaJours: number) => new Date(Date.now() - ilYaJours * 86_400_000).toISOString().slice(0, 10);

function Tuile({ titre, valeur, detail, alerte }: { titre: string; valeur: string; detail?: string; alerte?: boolean }) {
  return (
    <div className="flex flex-col gap-1 rounded-xl border border-slate-100 bg-white p-4">
      <span className="text-xs font-semibold text-gray-500">{titre}</span>
      <span className={`text-2xl font-bold tabular-nums ${alerte ? "text-[#B91C1C]" : "text-gray-900"}`}>{valeur}</span>
      {detail && <span className="text-xs text-gray-500">{detail}</span>}
    </div>
  );
}

const part = (n: number, total: number) => (total > 0 ? Math.round((n / total) * 100) : 0);

/** Incidents signalés par jour : une barre par jour, la date et le nombre au survol. */
function ParJour({ jours }: { jours: StatistiquesIncidents["par_jour"] }) {
  const max = Math.max(1, ...jours.map((j) => j.total));
  if (jours.every((j) => j.total === 0)) return <p className="py-6 text-center text-sm text-gray-400">Aucun incident sur la période.</p>;
  return (
    <div>
      <div className="flex h-28 items-end gap-[2px]" role="img" aria-label="Incidents signalés par jour">
        {jours.map((j) => (
          <div
            key={j.jour}
            title={`${formatJour(j.jour)} : ${j.total}`}
            className="min-w-[3px] flex-1 rounded-t bg-[#F17922]"
            style={{ height: `${Math.max(j.total > 0 ? 6 : 1, Math.round((j.total / max) * 100))}%`, opacity: j.total > 0 ? 1 : 0.15 }}
          />
        ))}
      </div>
      <div className="mt-1 flex justify-between text-[11px] text-gray-400">
        <span>{formatJour(jours[0]?.jour)}</span>
        <span>{formatJour(jours[jours.length - 1]?.jour)}</span>
      </div>
    </div>
  );
}

/**
 * TABLEAU DE BORD DES INCIDENTS (revue du lundi) : combien, où, pourquoi,
 * en combien de temps, et ce que les gestes ont coûté. La période porte sur
 * la date du signalement ; un point de vente ne voit que son restaurant.
 */
export function TableauDeBordIncidents({ pointDeVente }: { pointDeVente: boolean }) {
  const [preset, setPreset] = useState<Preset>("30");
  const [du, setDu] = useState(jourISO(29));
  const [au, setAu] = useState(jourISO(0));
  const [restaurantId, setRestaurantId] = useState("");

  const choisir = (p: Preset) => {
    setPreset(p);
    if (p !== "libre") {
      setDu(jourISO(Number(p) - 1));
      setAu(jourISO(0));
    }
  };

  const { data: s, isPending, isError, error, isFetching } = useStatistiquesIncidentsQuery({
    du,
    au,
    ...(restaurantId && { restaurantId }),
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex items-center gap-1 rounded-xl bg-[#f4f4f5] p-1">
          {PRESETS.map((p) => (
            <button
              key={p.cle}
              type="button"
              onClick={() => choisir(p.cle)}
              className={`whitespace-nowrap rounded-lg px-3 py-1 text-[13px] font-semibold ${
                preset === p.cle ? "bg-white text-[#F17922] shadow-sm" : "text-[#71717A] hover:text-gray-700"
              }`}
            >
              {p.libelle}
            </button>
          ))}
        </div>
        {preset === "libre" && (
          <div className="flex items-center gap-2">
            <input type="date" value={du} max={au} onChange={(e) => e.target.value && setDu(e.target.value)} className={`${classeChamp} w-auto`} aria-label="Du" />
            <span className="text-xs text-gray-400">au</span>
            <input type="date" value={au} min={du} max={jourISO(0)} onChange={(e) => e.target.value && setAu(e.target.value)} className={`${classeChamp} w-auto`} aria-label="Au" />
          </div>
        )}
        {!pointDeVente && <FiltreRestaurant valeur={restaurantId} onChange={setRestaurantId} />}
        {isFetching && !isPending && <Loader2 className="mb-2 h-4 w-4 animate-spin text-[#F17922]" />}
      </div>

      {isPending ? (
        <div className="flex justify-center rounded-xl border border-slate-100 bg-white py-16">
          <Loader2 className="h-6 w-6 animate-spin text-[#F17922]" />
        </div>
      ) : isError || !s ? (
        <div className="rounded-xl border border-slate-100 bg-white py-12 text-center text-sm text-red-600">
          {messageErreurIncident(error, "Impossible de lire le tableau de bord.")}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
            <Tuile titre="Incidents signalés" valeur={String(s.total)} detail={`du ${formatJour(s.du)} au ${formatJour(s.au)}`} />
            <Tuile titre="À résoudre" valeur={String(s.ouverts + s.en_cours)} detail={`${s.ouverts} ouverts, ${s.en_cours} en cours`} />
            <Tuile titre="En retard" valeur={String(s.en_retard)} detail="délai dépassé, pas encore résolus" alerte={s.en_retard > 0} />
            <Tuile
              titre="Délai moyen de résolution"
              valeur={s.delai_moyen_heures === null ? "Aucun" : dureeEnMots(s.delai_moyen_heures * 3_600_000)}
              detail="du signalement à la résolution"
            />
            <Tuile
              titre="Résolus dans les délais"
              valeur={s.dans_les_delais_pct === null ? "Aucun" : `${s.dans_les_delais_pct} %`}
              detail={`${s.resolus + s.clotures} résolus, dont ${s.clotures} clôturés`}
            />
            <Tuile titre="Bons offerts" valeur={String(s.bons.nombre)} detail={formatMontant(s.bons.montant)} />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Bloc titre="Par catégorie">
              <BarresRepartition
                lignes={s.par_categorie.map((c) => ({ label: c.nom, nombre: c.total, part: part(c.total, s.total) }))}
                vide="Aucun incident sur la période."
              />
            </Bloc>
            {!pointDeVente && (
              <Bloc titre="Par restaurant">
                <BarresRepartition
                  lignes={s.par_restaurant.map((r) => ({ label: r.name, nombre: r.total, part: part(r.total, s.total) }))}
                  vide="Aucun incident sur la période."
                />
              </Bloc>
            )}
            <Bloc titre="Incidents par jour">
              <ParJour jours={s.par_jour} />
            </Bloc>
            <Bloc titre="Par responsable">
              <BarresRepartition
                lignes={s.par_pole.map((p) => ({ label: LIBELLE_POLE[p.pole], nombre: p.total, part: part(p.total, s.total) }))}
                vide="Aucun incident sur la période."
              />
            </Bloc>
            <Bloc titre="D'où viennent les signalements">
              <BarresRepartition
                lignes={s.par_origine.map((o) => ({ label: LIBELLE_ORIGINE[o.origine], nombre: o.total, part: part(o.total, s.total) }))}
                vide="Aucun incident sur la période."
              />
            </Bloc>
            <Bloc titre="Gestes pour les clients">
              <BarresRepartition
                lignes={s.gestes.map((g) => ({ label: LIBELLE_GESTE[g.geste], nombre: g.total }))}
                vide="Aucun incident résolu sur la période."
              />
            </Bloc>
          </div>

          <Bloc titre="Dernières actions correctives">
            {s.corrections.length === 0 ? (
              <p className="py-4 text-center text-sm text-gray-400">Aucun incident résolu sur la période.</p>
            ) : (
              <ul className="flex flex-col divide-y divide-gray-100">
                {s.corrections.map((c) => (
                  <li key={c.id} className="flex flex-col gap-1 py-3 text-[13px] first:pt-0 last:pb-0">
                    <span className="font-semibold text-gray-900">
                      {c.categorie} · {c.restaurant}
                      <span className="ml-2 text-xs font-normal text-gray-400">{formatJour(c.resolu_at)}</span>
                    </span>
                    <span className="text-gray-600">Cause : {c.cause}</span>
                    <span className="text-gray-900">Action : {c.action}</span>
                  </li>
                ))}
              </ul>
            )}
          </Bloc>
        </>
      )}
    </div>
  );
}
