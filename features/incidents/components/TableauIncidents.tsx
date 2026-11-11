"use client";

import React, { useEffect, useRef, useState } from "react";
import { AlertTriangle, RotateCw } from "lucide-react";
import { useMaintenant } from "../../livreurs/hook/use-maintenant";
import { useTableauIncidentsQuery } from "../queries/incident.query";
import { useIncidentsUi } from "../stores/incident-ui.store";
import type { FiltresIncidents as Filtres, IncidentStatut } from "../types/incident.types";
import { LIBELLE_STATUT, STATUTS, filtresNets } from "../utils/incident";
import { CarteIncident } from "./CarteIncident";
import { FiltresIncidents } from "./FiltresIncidents";

const VIDE: Record<IncidentStatut, string> = {
  OUVERT: "Rien à prendre",
  EN_COURS: "Aucun incident en cours",
  RESOLU: "Aucun client à rappeler",
  CLOTURE: "Aucune clôture ces 7 derniers jours",
};

/** Sous le titre de la colonne : ce qu'on y attend de l'équipe. */
const ATTENDU: Record<IncidentStatut, string> = {
  OUVERT: "À prendre en charge",
  EN_COURS: "À résoudre",
  RESOLU: "Client à informer",
  CLOTURE: "Les 7 derniers jours",
};

/**
 * TABLEAU DES INCIDENTS : Ouvert, En cours, Résolu, Clôturé.
 *
 * Grand écran : les quatre colonnes côte à côte, chacune défile seule.
 * Téléphone et tablette : une colonne à la fois, les colonnes en boutons
 * avec leur nombre, et on glisse à gauche ou à droite pour passer à la
 * voisine (comme le tableau des courses).
 *
 * Un incident n'avance pas en le faisant glisser : chaque étape demande une
 * saisie (cause, geste, réaction du client), faite dans la fiche.
 */
export function TableauIncidents({ pointDeVente }: { pointDeVente: boolean }) {
  const ouvrirFiche = useIncidentsUi((s) => s.ouvrirFiche);
  const [filtres, setFiltres] = useState<Filtres>({});
  const [saisie, setSaisie] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setFiltres((f) => ({ ...f, recherche: saisie.trim() })), 350);
    return () => clearTimeout(t);
  }, [saisie]);

  const { data, isPending, isError, refetch, isFetching } = useTableauIncidentsQuery(filtresNets(filtres));
  const maintenant = useMaintenant(60_000);
  const [colonneChoisie, setColonneChoisie] = useState<IncidentStatut | null>(null);
  const depart = useRef<{ x: number; y: number } | null>(null);

  const colonnes = data?.colonnes;
  const premiereOccupee = STATUTS.find((s) => (colonnes?.[s].total ?? 0) > 0) ?? "OUVERT";
  const colonneMobile = colonneChoisie ?? premiereOccupee;
  const avecRestaurant = !pointDeVente && !filtres.restaurantId;

  const cartes = (statut: IncidentStatut) => {
    const colonne = colonnes?.[statut];
    if (!colonne || colonne.incidents.length === 0) {
      return (
        <p className="rounded-xl border border-dashed border-[#E4E4E7] px-3 py-6 text-center text-xs text-[#A1A1AA]">{VIDE[statut]}</p>
      );
    }
    return (
      <>
        {colonne.incidents.map((i) => (
          <CarteIncident key={i.id} incident={i} maintenant={maintenant} avecRestaurant={avecRestaurant} onOuvrir={ouvrirFiche} />
        ))}
        {colonne.total > colonne.incidents.length && (
          <p className="px-1 py-1 text-center text-[11px] text-[#A1A1AA]">
            {colonne.total - colonne.incidents.length} de plus dans l&apos;historique
          </p>
        )}
      </>
    );
  };

  const nombre = (statut: IncidentStatut, choisie = false) => {
    const n = colonnes?.[statut].total ?? 0;
    return (
      <span
        className={`min-w-[20px] rounded-full px-1.5 py-0.5 text-center text-[11px] font-semibold leading-none ${
          choisie ? "bg-white text-[#F17922]" : statut === "OUVERT" && n > 0 ? "bg-red-100 text-red-700" : "bg-white text-[#52525B]"
        }`}
      >
        {n}
      </span>
    );
  };

  const voisine = (statut: IncidentStatut, sens: 1 | -1): IncidentStatut =>
    STATUTS[Math.min(STATUTS.length - 1, Math.max(0, STATUTS.indexOf(statut) + sens))];

  return (
    <div className="flex flex-col gap-4">
      <FiltresIncidents
        filtres={filtres}
        recherche={saisie}
        onRecherche={setSaisie}
        onChange={(maj) => setFiltres((f) => ({ ...f, ...maj }))}
        pointDeVente={pointDeVente}
      />

      {isError && !data ? (
        <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span className="flex-1">Impossible de lire les incidents.</span>
          <button
            type="button"
            onClick={() => void refetch()}
            disabled={isFetching}
            className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-white px-2.5 py-1 text-xs font-semibold hover:bg-red-50 disabled:opacity-50"
          >
            <RotateCw className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`} />
            Réessayer
          </button>
        </div>
      ) : isPending ? (
        <div aria-hidden className="grid gap-3 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className={`space-y-2 rounded-2xl bg-[#F4F4F5]/70 p-2 ${i > 0 ? "hidden lg:block" : ""}`}>
              <div className="h-4 w-24 animate-pulse rounded-full bg-[#E4E4E7]" />
              {[0, 1].map((j) => (
                <div key={j} className="h-24 animate-pulse rounded-xl bg-white" />
              ))}
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* Grand écran : les quatre colonnes. */}
          <div className="hidden gap-3 lg:grid lg:grid-cols-4">
            {STATUTS.map((statut) => (
              <section key={statut} aria-label={LIBELLE_STATUT[statut]} className="flex min-w-0 flex-col rounded-2xl bg-[#F4F4F5]/70 p-2">
                <h3 className="flex items-center justify-between gap-2 px-1.5 pt-1 text-[13px] font-semibold text-[#18181B]">
                  <span className="truncate">{LIBELLE_STATUT[statut]}</span>
                  {nombre(statut)}
                </h3>
                <p className="px-1.5 pb-2 text-[11px] text-[#A1A1AA]">{ATTENDU[statut]}</p>
                <div className="flex max-h-[calc(100dvh-24rem)] min-h-[120px] flex-col gap-2 overflow-y-auto pr-0.5">
                  {cartes(statut)}
                </div>
              </section>
            ))}
          </div>

          {/* Téléphone et tablette : une colonne à la fois. */}
          <div className="lg:hidden">
            <div role="tablist" aria-label="Colonnes" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-2">
              {STATUTS.map((statut) => {
                const choisie = statut === colonneMobile;
                return (
                  <button
                    key={statut}
                    type="button"
                    role="tab"
                    aria-selected={choisie}
                    onClick={() => setColonneChoisie(statut)}
                    className={`inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3 text-[13px] font-semibold transition-colors ${
                      choisie ? "border-[#F17922] bg-[#F17922] text-white" : "border-[#E4E4E7] bg-white text-[#18181B]"
                    }`}
                  >
                    {LIBELLE_STATUT[statut]}
                    {nombre(statut, choisie)}
                  </button>
                );
              })}
            </div>
            <div
              className="flex flex-col gap-2 pt-1"
              onTouchStart={(e) => {
                const t = e.touches[0];
                depart.current = { x: t.clientX, y: t.clientY };
              }}
              onTouchEnd={(e) => {
                const d = depart.current;
                depart.current = null;
                if (!d) return;
                const t = e.changedTouches[0];
                const dx = t.clientX - d.x;
                const dy = t.clientY - d.y;
                // Un vrai glissé de côté (pas un défilement) : colonne voisine.
                if (Math.abs(dx) > 60 && Math.abs(dx) > 2 * Math.abs(dy)) setColonneChoisie(voisine(colonneMobile, dx < 0 ? 1 : -1));
              }}
            >
              {cartes(colonneMobile)}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
