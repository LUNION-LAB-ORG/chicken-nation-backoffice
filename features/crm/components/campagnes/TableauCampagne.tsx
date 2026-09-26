import React, { useRef, useState } from "react";
import { ArrowLeft, ListChecks, Lock, MessageSquareWarning } from "lucide-react";
import StatsChartCard from "@/components/gestion/Statistiques/shared/StatsChartCard";
import { useCampagneStatsQuery } from "../../queries/campagne.query";
import { ICampagne, ICampagnePublic, ICampagneStats } from "../../types/campagne.type";
import { Public } from "../../types/contact.type";
import { PUBLICS, PUBLIC_META, accord, estCapte, fmtDate, fmtNombre, fmtPct, libelleStatut } from "../../utils/crm-ui";
import { BarresRepartition } from "../commun/BarresRepartition";
import { Chargement, Erreur } from "../commun/Etats";
import { PuceCampagne, PucePublic } from "../commun/Puces";
import { ActionsCampagne } from "./ActionsCampagne";
import { AgentsCampagne } from "./AgentsCampagne";
import { ApercuPopulation } from "./ApercuPopulation";
import { ONGLET_PUBLIC, criteresCampagne, criteresEnClair } from "./etat-campagne";
import { KpisCampagne } from "./KpisCampagne";
import { PublicsCampagne } from "./PublicsCampagne";
import { RythmeCampagne } from "./RythmeCampagne";
import { useRestaurantsCapture } from "./useRestaurantsCapture";
import { VentesCampagne } from "./VentesCampagne";

/** Publics visés et leurs critères en clair : ceux du serveur une fois lancée, sinon écrits ici. */
function PublicsVises({ c, s }: { c: ICampagne; s?: ICampagneStats }) {
  const { noms } = useRestaurantsCapture();
  const source: (ICampagnePublic & { criteres?: string })[] = s?.campagne.publics?.length ? s.campagne.publics : (c.publics ?? []);
  const publics = [...source].sort((a, b) => PUBLICS.indexOf(a.segment) - PUBLICS.indexOf(b.segment));
  if (publics.length === 0) return null;

  return (
    <ul className="space-y-1.5">
      {publics.map((p) => {
        const criteres = p.criteres || criteresEnClair(p, noms);
        const objectifs = [
          p.target_contacts_count != null ? `${fmtNombre(p.target_contacts_count)} à joindre` : null,
          p.target_conversion_rate != null ? `${PUBLIC_META[p.segment].taux.toLowerCase()} visé ${fmtPct(p.target_conversion_rate)}` : null,
        ].filter(Boolean);
        return (
          <li key={p.segment} className="flex flex-wrap items-start gap-x-2 gap-y-0.5 text-sm">
            <PucePublic segment={p.segment} />
            <span className="text-gray-600 min-w-0 flex-1">
              {criteres}
              {p.offer && <span className="text-gray-500"> · offre : {p.offer.label}</span>}
              {objectifs.length > 0 && <span className="text-gray-500"> · objectif : {objectifs.join(", ")}</span>}
              {c.status !== "PLANIFIED" && (
                <span className="text-gray-400">
                  {" "}
                  · {fmtNombre(p.targeted_count)} {accord(p.targeted_count, "ciblé")} au lancement
                </span>
              )}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

/** Où en sont les contacts, pour toute la campagne ou pour un public ; libellés au vocabulaire du public. */
function StatutsCampagne({ s }: { s: ICampagneStats }) {
  const publics = (s.par_public ?? []).map((p) => p.segment);
  const [choix, setChoix] = useState<Public | "TOUS">("TOUS");
  const ligne = choix === "TOUS" ? null : (s.par_public ?? []).find((p) => p.segment === choix);
  const statuts = ligne ? ligne.statuts : s.statuts;
  // « Tous » garde le vocabulaire du public quand il n'y en a qu'un, ou seulement Glovo et Yango.
  const segment: Public | undefined = ligne
    ? ligne.segment
    : publics.length > 0 && (publics.length === 1 || publics.every(estCapte))
      ? publics[0]
      : undefined;
  const sousTitre = s.chiffres_figes ? "Chiffres figés à la clôture" : "Statut actuel des ciblés";

  return (
    <StatsChartCard title="Où en sont les contacts" subtitle={sousTitre} icon={s.chiffres_figes ? Lock : ListChecks}>
      {publics.length > 1 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {(["TOUS", ...publics] as const).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setChoix(p)}
              className={`text-xs font-semibold px-2.5 py-1 rounded-lg ${
                choix === p ? "bg-orange-50 text-[#F17922]" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {p === "TOUS" ? "Tous" : ONGLET_PUBLIC[p]}
            </button>
          ))}
        </div>
      )}
      <BarresRepartition
        couleur="#3B82F6"
        lignes={(statuts ?? []).map((x) => ({ label: libelleStatut(x.statut, segment), nombre: x.nombre }))}
        vide="Aucun contact pour ce public."
      />
    </StatsChartCard>
  );
}

/** Tableau de bord d'une campagne (cahier §6.3), ventilé par public (lot 3). */
export function TableauCampagne({
  c,
  onRetour,
  estGestionnaire,
  estPilote,
  peutExporter,
  onModifier,
  onEquipe,
  onOuvrirFiche,
}: {
  c: ICampagne;
  onRetour: () => void;
  estGestionnaire: boolean;
  estPilote: boolean;
  peutExporter: boolean;
  onModifier: () => void;
  onEquipe: () => void;
  /** Le téléphone accompagne la fiche : un agent de l'équipe ouvre en lecture le client d'un collègue. */
  onOuvrirFiche: (id: string, telephone?: string) => void;
}) {
  const { data: s, isError, error, dataUpdatedAt } = useCampagneStatsQuery(c.status === "PLANIFIED" ? null : c.id);
  const refVentes = useRef<HTMLDivElement>(null);
  // Le focus suit le défilement : au clavier, la touche Tab repart de la liste des ventes.
  const voirVentes = () => {
    const section = refVentes.current;
    if (!section) return;
    section.scrollIntoView({ behavior: "smooth", block: "start" });
    section.focus({ preventScroll: true });
  };
  const plusieursPublics = (s?.par_public ?? []).length > 1;
  const montrerPublics = !!s && (plusieursPublics || (s.par_public ?? []).some((p) => p.segment === "GLOVO" || p.segment === "YANGO"));

  return (
    <div className="space-y-4">
      <button type="button" onClick={onRetour} className="inline-flex items-center gap-1 text-sm font-semibold text-gray-500 hover:text-[#F17922]">
        <ArrowLeft className="w-4 h-4" /> Toutes les campagnes
      </button>

      <div className="bg-white border border-gray-200 rounded-2xl p-4 space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-bold text-gray-900">{c.name}</h2>
              <PuceCampagne statut={c.status} />
            </div>
            <p className="text-sm text-gray-500">
              {c.end_date ? `Du ${fmtDate(c.start_date)} au ${fmtDate(c.end_date)}` : `Depuis le ${fmtDate(c.start_date)}, sans fin prévue`} · pilote {c.lead_agent.fullname} ·{" "}
              {c.assigned_agents.map((a) => a.agent.fullname).join(", ")}
            </p>
            {c.description && <p className="text-sm text-gray-600 mt-1">{c.description}</p>}
          </div>
        </div>
        <PublicsVises c={c} s={s} />
        <ActionsCampagne
          c={c}
          s={s}
          estGestionnaire={estGestionnaire}
          estPilote={estPilote}
          peutExporter={peutExporter}
          onModifier={onModifier}
          onEquipe={onEquipe}
        />
      </div>

      {c.status === "PLANIFIED" ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-4 space-y-3">
          <p className="text-sm text-gray-500 text-center py-2">
            Le tableau de bord se remplit dès le lancement.
            {c.offer && ` Les coupons proposeront : ${c.offer.label}.`}
          </p>
          {estGestionnaire && (
            <ApercuPopulation
              preparer={() => ({ publics: criteresCampagne(c), agent_ids: c.assigned_agents.map((a) => a.agent.id) })}
            />
          )}
        </div>
      ) : isError && !s ? (
        <Erreur message={(error as Error)?.message} />
      ) : !s ? (
        <Chargement />
      ) : (
        <>
          <KpisCampagne s={s} onVoirVentes={voirVentes} />
          {montrerPublics && <PublicsCampagne s={s} />}
          <div ref={refVentes} tabIndex={-1} className="scroll-mt-4 focus:outline-none">
            <VentesCampagne
              key={c.id}
              campagneId={c.id}
              publics={(s.campagne.publics ?? []).map((p) => p.segment)}
              synchro={dataUpdatedAt}
              onOuvrirFiche={onOuvrirFiche}
            />
          </div>
          <RythmeCampagne rythme={s.rythme} />
          <div className="grid gap-4 lg:grid-cols-2">
            <StatsChartCard title="Raisons de non-commande" subtitle="Dernière raison donnée par chaque contact" icon={MessageSquareWarning}>
              <BarresRepartition
                lignes={s.raisons.map((r) => ({ label: r.raison, nombre: r.nombre, part: r.part }))}
                vide="Aucun refus motivé pour l'instant."
              />
            </StatsChartCard>
            <StatutsCampagne s={s} />
          </div>
          <AgentsCampagne agents={s.agents} ventesSansAgent={s.ventes_sans_agent} plusieursPublics={plusieursPublics} />
        </>
      )}
    </div>
  );
}
