import React, { useEffect, useState } from "react";
import { MessagesSquare, Search } from "lucide-react";
import StatsChartCard from "@/components/gestion/Statistiques/shared/StatsChartCard";
import { Pagination } from "@/components/ui/pagination";
import { useVerbatimsQuery } from "../../queries/analyse.query";
import { IPeriode } from "../../types/analyse.type";
import { fmtDateHeure } from "../../utils/prospect-ui";
import { classeChamp } from "../commun/Champs";

/**
 * Verbatims (cahier §7) : ce que disent les clients, dans leurs mots, en
 * complément des raisons codifiées. Les mots fréquents se cliquent pour filtrer.
 */
export function Verbatims({ periode, onOuvrir }: { periode: IPeriode; onOuvrir: (id: string) => void }) {
  const [texte, setTexte] = useState("");
  const [recherche, setRecherche] = useState("");
  const [page, setPage] = useState(1);
  const { data } = useVerbatimsQuery({ ...periode, search: recherche || undefined, page });

  useEffect(() => {
    const m = setTimeout(() => {
      setRecherche(texte.trim());
      setPage(1);
    }, 400);
    return () => clearTimeout(m);
  }, [texte]);

  return (
    <StatsChartCard title="Verbatims" subtitle={`${data?.meta.total ?? 0} commentaires d'agents`} icon={MessagesSquare}>
      <label className="relative block mb-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input value={texte} onChange={(e) => setTexte(e.target.value)} placeholder="Chercher un mot : prix, livraison, paiement…" className={`${classeChamp} pl-9`} />
      </label>

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
            <p className="text-xs text-gray-500 mt-1">
              <button type="button" onClick={() => onOuvrir(v.prospect_id)} className="font-semibold text-gray-700 hover:text-[#F17922]">
                {v.prospect}
              </button>{" "}
              · {v.status_label}
              {v.raison && ` · ${v.raison}`} · {v.agent ?? "agent inconnu"} · {fmtDateHeure(v.created_at)}
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
    </StatsChartCard>
  );
}
