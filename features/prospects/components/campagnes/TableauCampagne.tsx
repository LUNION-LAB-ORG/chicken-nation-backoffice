import React from "react";
import { ArrowLeft, ListChecks, MessageSquareWarning } from "lucide-react";
import StatsChartCard from "@/components/gestion/Statistiques/shared/StatsChartCard";
import { useCampagneStatsQuery } from "../../queries/campagne.query";
import { ICampagne } from "../../types/campagne.type";
import { ProspectStatut } from "../../types/prospect.type";
import { STATUT_META, fmtDate } from "../../utils/prospect-ui";
import { BarresRepartition } from "../commun/BarresRepartition";
import { Chargement, Erreur } from "../commun/Etats";
import { PuceCampagne } from "../commun/Puces";
import { ActionsCampagne } from "./ActionsCampagne";
import { AgentsCampagne } from "./AgentsCampagne";
import { KpisCampagne } from "./KpisCampagne";
import { RythmeCampagne } from "./RythmeCampagne";

/** Tableau de bord d'une campagne (cahier §6.3). */
export function TableauCampagne({
  c,
  onRetour,
  estGestionnaire,
  estPilote,
  peutExporter,
  onModifier,
  onEquipe,
}: {
  c: ICampagne;
  onRetour: () => void;
  estGestionnaire: boolean;
  estPilote: boolean;
  peutExporter: boolean;
  onModifier: () => void;
  onEquipe: () => void;
}) {
  const { data: s, isLoading, isError, error } = useCampagneStatsQuery(c.status === "PLANIFIED" ? null : c.id);

  return (
    <div className="space-y-4">
      <button type="button" onClick={onRetour} className="inline-flex items-center gap-1 text-sm font-semibold text-gray-500 hover:text-[#F17922]">
        <ArrowLeft className="w-4 h-4" /> Toutes les campagnes
      </button>

      <div className="bg-white border border-gray-200 rounded-2xl p-4 space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-gray-900">{c.name}</h2>
              <PuceCampagne statut={c.status} />
            </div>
            <p className="text-sm text-gray-500">
              Du {fmtDate(c.start_date)} au {c.end_date ? fmtDate(c.end_date) : "sans fin prévue"} · pilote {c.lead_agent.fullname} ·{" "}
              {c.assigned_agents.map((a) => a.agent.fullname).join(", ")}
            </p>
            {c.description && <p className="text-sm text-gray-600 mt-1">{c.description}</p>}
          </div>
        </div>
        <ActionsCampagne c={c} estGestionnaire={estGestionnaire} estPilote={estPilote} peutExporter={peutExporter} onModifier={onModifier} onEquipe={onEquipe} />
      </div>

      {c.status === "PLANIFIED" ? (
        <p className="text-sm text-gray-500 bg-white border border-gray-200 rounded-2xl p-6 text-center">
          Le tableau de bord se remplit dès le lancement.
          {c.offer && ` Les coupons proposeront : ${c.offer.label}.`}
        </p>
      ) : isLoading ? (
        <Chargement />
      ) : isError || !s ? (
        <Erreur message={(error as Error)?.message} />
      ) : (
        <>
          <KpisCampagne s={s} />
          <RythmeCampagne rythme={s.rythme} />
          <div className="grid gap-4 lg:grid-cols-2">
            <StatsChartCard title="Raisons de non-commande" subtitle="Dernière raison donnée par chaque prospect" icon={MessageSquareWarning}>
              <BarresRepartition
                lignes={s.raisons.map((r) => ({ label: r.raison, nombre: r.nombre, part: r.part }))}
                vide="Aucun refus motivé pour l'instant."
              />
            </StatsChartCard>
            <StatsChartCard title="Où en sont les prospects" subtitle="Statut actuel des ciblés" icon={ListChecks}>
              <BarresRepartition
                couleur="#3B82F6"
                lignes={s.statuts.map((x) => ({ label: STATUT_META[x.statut as ProspectStatut]?.label ?? x.statut, nombre: x.nombre }))}
              />
            </StatsChartCard>
          </div>
          <AgentsCampagne agents={s.agents} />
        </>
      )}
    </div>
  );
}
