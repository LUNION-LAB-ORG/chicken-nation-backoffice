import React, { useEffect, useState } from "react";
import { MessagesSquare, Search } from "lucide-react";
import StatsChartCard from "@/components/gestion/Statistiques/shared/StatsChartCard";
import { Pagination } from "@/components/ui/pagination";
import { useVerbatimsQuery } from "../../queries/analyse.query";
import { useAgentsQuery } from "../../queries/contact.query";
import { useRaisonsQuery } from "../../queries/reglage.query";
import { IPeriode } from "../../types/analyse.type";
import { compter, fmtDateHeure } from "../../utils/crm-ui";
import { ChampSelect, classeChamp } from "../commun/Champs";
import { EtatRequete } from "../commun/Etats";
import { PucePublic } from "../commun/Puces";

/**
 * Verbatims : ce que disent les clients, dans leurs mots, en complément des
 * raisons codifiées. Filtrables par raison et par agent ; les mots fréquents
 * se cliquent pour filtrer.
 */
export function Verbatims({ periode, onOuvrir }: { periode: IPeriode; onOuvrir: (id: string) => void }) {
  const [texte, setTexte] = useState("");
  const [recherche, setRecherche] = useState("");
  const [raison, setRaison] = useState("");
  const [agent, setAgent] = useState("");
  const [page, setPage] = useState(1);
  const { data: raisons = [] } = useRaisonsQuery();
  const { data: agents = [] } = useAgentsQuery();
  const requete = useVerbatimsQuery({
    ...periode,
    search: recherche || undefined,
    loss_reason_id: raison || undefined,
    agent_id: agent || undefined,
    page,
  });
  const { data } = requete;
  const total = data?.meta.total ?? 0;

  useEffect(() => {
    const m = setTimeout(() => {
      setRecherche(texte.trim());
      setPage(1);
    }, 400);
    return () => clearTimeout(m);
  }, [texte]);

  // Un autre filtre du tableau de bord ramène à la première page.
  const clePeriode = JSON.stringify(periode);
  useEffect(() => setPage(1), [clePeriode]);

  return (
    <StatsChartCard
      title="Verbatims"
      subtitle={data ? compter(total, "commentaire d'agent", "commentaires d'agents") : "Commentaires d'agents"}
      icon={MessagesSquare}
    >
      <div className="space-y-2 mb-3">
        <label className="relative block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={texte}
            onChange={(e) => setTexte(e.target.value)}
            placeholder="Chercher un mot : prix, livraison, paiement…"
            className={`${classeChamp} pl-9`}
          />
        </label>
        <div className="grid gap-2 sm:grid-cols-2">
          <ChampSelect
            valeur={raison}
            onChange={(v) => {
              setRaison(v);
              setPage(1);
            }}
            vide="Toutes les raisons"
            options={raisons.map((r) => ({ value: r.id, label: r.name }))}
          />
          <ChampSelect
            valeur={agent}
            onChange={(v) => {
              setAgent(v);
              setPage(1);
            }}
            vide="Tous les agents"
            options={agents.map((a) => ({ value: a.id, label: a.fullname }))}
          />
        </div>
      </div>

      <EtatRequete requete={requete}>
        {!!data?.mots.length && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {data.mots.map((m) => (
              <button
                key={m.mot}
                type="button"
                onClick={() => setTexte(m.mot)}
                className="rounded-full bg-orange-50 text-[#C2410C] px-2.5 py-0.5 text-xs font-semibold hover:bg-orange-100"
              >
                {m.mot} <span className="text-orange-400">{m.nombre}</span>
              </button>
            ))}
          </div>
        )}

        <ul className="space-y-3 max-h-96 overflow-y-auto">
          {data?.data.map((v) => (
            <li key={v.id} className="border-l-2 border-orange-200 pl-3">
              <p className="text-sm text-gray-800 whitespace-pre-line">« {v.comment} »</p>
              <p className="text-xs text-gray-500 mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-1">
                {v.segment && <PucePublic segment={v.segment} />}
                <button type="button" onClick={() => onOuvrir(v.contact_id)} className="font-semibold text-gray-700 hover:text-[#F17922]">
                  {v.contact}
                </button>
                <span>
                  · {v.status_label}
                  {v.raison && ` · ${v.raison}`} · {v.agent ?? "agent inconnu"} · {fmtDateHeure(v.created_at)}
                </span>
              </p>
            </li>
          ))}
          {data?.data.length === 0 && <p className="text-sm text-gray-400 text-center py-6">Aucun commentaire.</p>}
        </ul>
        {(data?.meta.totalPages ?? 0) > 1 && (
          <div className="mt-3">
            <Pagination currentPage={page} totalPages={data!.meta.totalPages} onPageChange={setPage} />
          </div>
        )}
      </EtatRequete>
    </StatsChartCard>
  );
}
