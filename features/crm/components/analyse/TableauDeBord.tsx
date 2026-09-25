import React, { useState } from "react";
import { useCampagnesQuery } from "../../queries/campagne.query";
import {
  useAgentsPerfQuery,
  useParetoQuery,
  useQualiteQuery,
  useTendanceQuery,
  useVueEnsembleQuery,
} from "../../queries/analyse.query";
import { IPeriode } from "../../types/analyse.type";
import { Public } from "../../types/contact.type";
import { ICampagne } from "../../types/campagne.type";
import { modeDetail } from "../../utils/crm-ui";
import { ChampSelect } from "../commun/Champs";
import { ChoixPublics } from "../commun/ChoixPublics";
import { EtatRequete } from "../commun/Etats";
import { FiltrePeriode } from "../commun/FiltrePeriode";
import { AgentsPerf } from "./AgentsPerf";
import { CohortesPublic } from "./CohortesPublic";
import { ComparatifPublics } from "./ComparatifPublics";
import { CouponsResume } from "./CouponsResume";
import { Entonnoir } from "./Entonnoir";
import { EntonnoirsPublics } from "./EntonnoirsPublics";
import { KpisGlobaux } from "./KpisGlobaux";
import { Pareto } from "./Pareto";
import { PassageAppli } from "./PassageAppli";
import { Qualite } from "./Qualite";
import { Tendance } from "./Tendance";
import { Verbatims } from "./Verbatims";

/** Une campagne compte pour le filtre si elle vise au moins un des publics choisis (tous : toutes). */
const visePublics = (c: ICampagne, publics: Public[]) =>
  publics.length === 0 || (c.segments ?? []).some((s) => publics.includes(s));

/**
 * Tableau de bord du CRM, filtrable par période, par publics et par
 * campagne. Deux lectures :
 * - « Tous » ou plusieurs publics différents : les publics se comparent côte
 *   à côte (vue comparée, un mini-entonnoir par public, ventilations), sans
 *   jamais mélanger leurs entonnoirs ;
 * - un seul public, ou Glovo + Yango : l'entonnoir emboîté de ce public, et
 *   pour Glovo/Yango le passage sur l'appli.
 */
export function TableauDeBord({
  onOuvrir,
  publicsInitiaux,
  peutExporter,
}: {
  onOuvrir: (id: string) => void;
  /** Publics choisis à l'ouverture (ex. demandés depuis un autre écran). */
  publicsInitiaux?: Public[];
  peutExporter?: boolean;
}) {
  const [periode, setPeriode] = useState<IPeriode>(publicsInitiaux?.length ? { segments: publicsInitiaux } : {});
  const publics = periode.segments ?? [];
  const detail = modeDetail(publics);
  const comparer = !detail;

  const { data: toutesCampagnes = [] } = useCampagnesQuery();
  const campagnes = toutesCampagnes.filter((c) => c.status !== "PLANIFIED" && visePublics(c, publics));

  const vue = useVueEnsembleQuery(periode);
  const pareto = useParetoQuery(periode);
  const tendance = useTendanceQuery(periode);
  const qualite = useQualiteQuery(periode);
  const agents = useAgentsPerfQuery(periode);

  /** Changer de publics garde la période ; la campagne reste si elle vise encore l'un d'eux. */
  const choisirPublics = (segments: Public[]) =>
    setPeriode((p) => {
      const campagne = toutesCampagnes.find((c) => c.id === p.campaign_id);
      const garder = !campagne || visePublics(campagne, segments);
      return { ...p, segments, campaign_id: garder ? p.campaign_id : undefined };
    });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <FiltrePeriode valeur={periode} onChange={setPeriode} />
        <div className="flex flex-wrap items-center gap-2">
          <ChoixPublics valeur={publics} onChange={choisirPublics} />
          <div className="w-full sm:w-64">
            <ChampSelect
              valeur={periode.campaign_id ?? ""}
              onChange={(v) => setPeriode((p) => ({ ...p, campaign_id: v || undefined }))}
              vide="Toutes les campagnes"
              options={campagnes.map((c) => ({ value: c.id, label: c.name }))}
            />
          </div>
        </div>
      </div>

      <EtatRequete requete={vue}>{vue.data && <KpisGlobaux v={vue.data} publics={publics} />}</EtatRequete>

      {comparer && <ComparatifPublics periode={periode} peutExporter={peutExporter} onChoisir={choisirPublics} />}

      {comparer ? (
        <div className="grid gap-4 2xl:grid-cols-2">
          {vue.data && <EntonnoirsPublics entonnoirs={vue.data.entonnoirs ?? []} onChoisir={(p) => choisirPublics([p])} />}
          <EtatRequete requete={pareto}>{pareto.data && <Pareto pareto={pareto.data} publics={publics} parPublic />}</EtatRequete>
        </div>
      ) : (
        <>
          <div className="grid gap-4 xl:grid-cols-2">
            {vue.data && <Entonnoir etapes={vue.data.entonnoir} hors={vue.data.hors_entonnoir} publics={publics} />}
            <EtatRequete requete={pareto}>{pareto.data && <Pareto pareto={pareto.data} publics={publics} />}</EtatRequete>
          </div>
          {vue.data?.passage_appli && <PassageAppli p={vue.data.passage_appli} />}
        </>
      )}

      <EtatRequete requete={tendance}>
        {tendance.data && <Tendance t={tendance.data} publics={publics} parPublic={comparer} />}
      </EtatRequete>
      <EtatRequete requete={qualite}>{qualite.data && <Qualite q={qualite.data} publics={publics} />}</EtatRequete>
      <CouponsResume periode={periode} parPublic={publics.length !== 1} />

      {/* Côte à côte seulement sur très grand écran : le tableau des agents a neuf colonnes ou plus. */}
      <div className="grid gap-4 2xl:grid-cols-2">
        <EtatRequete requete={agents}>
          {agents.data && <AgentsPerf agents={agents.data} publics={publics} parPublic={comparer} />}
        </EtatRequete>
        <Verbatims periode={periode} onOuvrir={onOuvrir} />
      </div>

      <CohortesPublic periode={periode} />
    </div>
  );
}
