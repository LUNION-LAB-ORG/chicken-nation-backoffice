"use client";

import React, { useState } from "react";
import { BarChart3, History, Plus, Settings, SquareKanban } from "lucide-react";
import { useDroitsIncidents } from "../hooks/useDroitsIncidents";
import { useCompteursIncidentsQuery } from "../queries/incident.query";
import { useIncidentsUi } from "../stores/incident-ui.store";
import { HistoriqueIncidents } from "./HistoriqueIncidents";
import { ReglagesIncidents } from "./ReglagesIncidents";
import { TableauDeBordIncidents } from "./TableauDeBordIncidents";
import { TableauIncidents } from "./TableauIncidents";

type Vue = "tableau" | "historique" | "bord" | "reglages";

/**
 * ONGLET « INCIDENTS » DU CRM : le pont entre le CRM, les tickets et les avis.
 *
 * Trois vues : « En cours » (le tableau Ouvert, En cours, Résolu, Clôturé),
 * « Historique » (tous les incidents, filtres et export) et « Tableau de
 * bord » (les chiffres, à part des listes) ; « Réglages » en plus pour
 * l'administrateur (catégories, barème des bons). « Signaler un incident »
 * ouvre la même fenêtre que partout ailleurs, avec la recherche de la commande.
 */
export function Incidents() {
  const { signaler: peutSignaler, pointDeVente, exporter, regler } = useDroitsIncidents();
  const signaler = useIncidentsUi((s) => s.signaler);
  const { data: compteurs } = useCompteursIncidentsQuery();
  const [vue, setVue] = useState<Vue>("tableau");

  const aTraiter = compteurs ? compteurs.ouverts + compteurs.en_cours + compteurs.resolus : null;
  const vues: { cle: Vue; libelle: string; Icone: React.FC<{ className?: string }>; nombre: number | null }[] = [
    { cle: "tableau", libelle: "En cours", Icone: SquareKanban, nombre: aTraiter },
    { cle: "historique", libelle: "Historique", Icone: History, nombre: null },
    { cle: "bord", libelle: "Tableau de bord", Icone: BarChart3, nombre: null },
    ...(regler ? [{ cle: "reglages" as const, libelle: "Réglages", Icone: Settings, nombre: null }] : []),
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div role="tablist" aria-label="Vues des incidents" className="flex w-full gap-1 overflow-x-auto rounded-xl bg-[#F4F4F5] p-1 sm:w-fit">
          {vues.map(({ cle, libelle, Icone, nombre }) => {
            const choisie = cle === vue;
            return (
              <button
                key={cle}
                type="button"
                role="tab"
                aria-selected={choisie}
                onClick={() => setVue(cle)}
                className={`inline-flex h-9 flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg px-3 text-sm font-semibold transition-colors sm:flex-none sm:px-4 ${
                  choisie ? "bg-white text-[#18181B] shadow-sm" : "text-[#71717A] hover:text-[#18181B]"
                }`}
              >
                <Icone className={`h-4 w-4 ${choisie ? "text-[#F17922]" : ""}`} />
                {libelle}
                {nombre !== null && nombre > 0 && (
                  <span
                    className={`min-w-[20px] rounded-full px-1.5 py-0.5 text-[11px] leading-none ${
                      choisie ? "bg-orange-50 text-[#F17922]" : "bg-white text-[#52525B]"
                    }`}
                  >
                    {nombre}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {compteurs && compteurs.en_retard > 0 && (
            <span className="text-[13px] font-semibold text-[#B91C1C]">
              {compteurs.en_retard} en retard
            </span>
          )}
          {peutSignaler && (
            <button
              type="button"
              onClick={() => signaler()}
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#F17922] px-4 text-sm font-semibold text-white hover:bg-[#e06a15]"
            >
              <Plus className="h-4 w-4" />
              Signaler un incident
            </button>
          )}
        </div>
      </div>

      {vue === "tableau" && <TableauIncidents pointDeVente={pointDeVente} />}
      {vue === "historique" && <HistoriqueIncidents pointDeVente={pointDeVente} peutExporter={exporter} />}
      {vue === "bord" && <TableauDeBordIncidents pointDeVente={pointDeVente} />}
      {vue === "reglages" && regler && <ReglagesIncidents />}
    </div>
  );
}
