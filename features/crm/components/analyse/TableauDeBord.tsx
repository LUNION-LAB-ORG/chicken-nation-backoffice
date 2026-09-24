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
import { ChampSelect } from "../commun/Champs";
import { ChoixPublic } from "../commun/ChoixPublic";
import { Chargement, Erreur } from "../commun/Etats";
import { FiltrePeriode } from "../commun/FiltrePeriode";
import { AgentsPerf } from "./AgentsPerf";
import { Cohortes } from "./Cohortes";
import { CouponsResume } from "./CouponsResume";
import { Entonnoir } from "./Entonnoir";
import { KpisGlobaux } from "./KpisGlobaux";
import { Pareto } from "./Pareto";
import { Qualite } from "./Qualite";
import { Tendance } from "./Tendance";
import { Verbatims } from "./Verbatims";

/** Tableau de bord analytique global (cahier §7), filtrable par période et par campagne. */
export function TableauDeBord({ onOuvrir }: { onOuvrir: (id: string) => void }) {
  const [periode, setPeriode] = useState<IPeriode>({});
  const { data: campagnes = [] } = useCampagnesQuery();
  const vue = useVueEnsembleQuery(periode);
  const pareto = useParetoQuery(periode);
  const tendance = useTendanceQuery(periode);
  const qualite = useQualiteQuery(periode);
  const agents = useAgentsPerfQuery(periode);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <FiltrePeriode valeur={periode} onChange={setPeriode} />
        <div className="flex flex-wrap items-center gap-2">
          <ChoixPublic valeur={periode.segment} onChange={(segment) => setPeriode((p) => ({ ...p, segment }))} />
          <div className="w-64">
            <ChampSelect
              valeur={periode.campaign_id ?? ""}
              onChange={(v) => setPeriode((p) => ({ ...p, campaign_id: v || undefined }))}
              vide="Toutes les campagnes"
              options={campagnes.filter((c) => c.status !== "PLANIFIED").map((c) => ({ value: c.id, label: c.name }))}
            />
          </div>
        </div>
      </div>

      {vue.isError ? <Erreur message={(vue.error as Error)?.message} /> : !vue.data ? <Chargement /> : <KpisGlobaux v={vue.data} />}

      <div className="grid gap-4 xl:grid-cols-2">
        {vue.data && <Entonnoir etapes={vue.data.entonnoir} />}
        {pareto.data && <Pareto pareto={pareto.data} />}
      </div>

      {tendance.data && <Tendance serie={tendance.data} />}
      {qualite.data && <Qualite q={qualite.data} />}
      <CouponsResume periode={periode} />

      {/* Côte à côte seulement sur très grand écran : le tableau des agents a huit colonnes. */}
      <div className="grid gap-4 2xl:grid-cols-2">
        {agents.data && <AgentsPerf agents={agents.data} />}
        <Verbatims periode={periode} onOuvrir={onOuvrir} />
      </div>

      {/* Les cohortes suivent des inscriptions : elles ne disent rien des anciens clients ni des clients Glovo/Yango. */}
      {(!periode.segment || periode.segment === "JAMAIS_COMMANDE") && <Cohortes />}
    </div>
  );
}
