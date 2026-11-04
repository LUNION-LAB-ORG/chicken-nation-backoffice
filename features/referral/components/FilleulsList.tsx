"use client";

import React, { useState } from "react";
import { Pagination } from "@/components/ui/pagination";
import { Loader2 } from "lucide-react";
import { StatsFilters } from "../../statistics/filters/statistics.filters";
import { usePageSelonFiltres } from "../hooks/usePageSelonFiltres";
import { useReferralFilleulsQuery } from "../queries/referral.queries";
import { EtatFilleul, ReferralFilleulLigne } from "../types/referral.types";
import { fcfa, pluriel, shortDate } from "../utils/format";
import { ETAT_CADEAU, STATUT_FILLEUL } from "../utils/statuts";
import ReferralPastilles from "./ReferralPastilles";
import ReferralRecherche from "./ReferralRecherche";

const LIMIT = 10;

const Pastille: React.FC<{ style: { label: string; cls: string } }> = ({ style }) => (
  <span className={"text-[10px] font-semibold rounded-full px-2 py-0.5 whitespace-nowrap " + style.cls}>
    {style.label}
  </span>
);

const Ligne: React.FC<{ f: ReferralFilleulLigne; onOuvrirFiche: (id: string) => void }> = ({
  f,
  onOuvrirFiche,
}) => (
  <tr className="border-b border-[#F2F2F4] last:border-0 hover:bg-[#FAFAFA]">
    <td className="py-3 px-3">
      <div className="text-sm font-medium text-[#18181B]">{f.fullname ?? "Sans nom"}</div>
      <div className="text-xs text-[#9796A1]">{f.phone}</div>
    </td>
    <td className="py-3 px-3">
      <div className="text-sm text-[#18181B]">{f.referrer_name ?? "Sans nom"}</div>
      {f.referrer_code && (
        <span className="text-[10px] font-semibold text-[#F17922]">{f.referrer_code}</span>
      )}
    </td>
    <td className="py-3 px-3 text-xs text-[#71717A] whitespace-nowrap">{shortDate(f.joined_at)}</td>
    <td className="py-3 px-3">{f.gift && <Pastille style={ETAT_CADEAU[f.gift]} />}</td>
    <td className="py-3 px-3">
      <Pastille style={STATUT_FILLEUL[f.status] ?? STATUT_FILLEUL.PENDING} />
      {f.qualified_at && (
        <div className="text-[11px] text-[#9796A1] mt-0.5 whitespace-nowrap">le {shortDate(f.qualified_at)}</div>
      )}
    </td>
    <td className="py-3 px-3 text-right text-sm text-[#18181B] whitespace-nowrap">
      {fcfa(f.sales)}
      <div className="text-[11px] text-[#9796A1]">{pluriel(f.orders_count, "commande")}</div>
    </td>
    <td className="py-3 px-3 text-right">
      <button
        type="button"
        onClick={() => onOuvrirFiche(f.referrer_id)}
        className="text-sm font-medium text-[#F17922] border border-[#F17922]/30 rounded-lg px-3 py-1.5 hover:bg-[#FFF6E9] cursor-pointer whitespace-nowrap"
      >
        Voir le parrain
      </button>
    </td>
  </tr>
);

/** Tous les filleuls : on voit à qui ils sont rattachés et où ils en sont. */
export default function FilleulsList({
  filtres,
  etatInitial,
  onOuvrirFiche,
}: {
  filtres: StatsFilters;
  etatInitial?: EtatFilleul;
  onOuvrirFiche: (id: string) => void;
}) {
  const [search, setSearch] = useState("");
  const [etat, setEtat] = useState<EtatFilleul | null>(etatInitial ?? null);
  const [page, setPage] = usePageSelonFiltres({ filtres, search, etat });

  const { data, isLoading, isError, error, isFetching, isPlaceholderData } = useReferralFilleulsQuery({
    page,
    limit: LIMIT,
    search: search || undefined,
    etat: etat ?? undefined,
    filtres,
  });

  const items = data?.items ?? [];
  const n = data?.compteurs;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <ReferralPastilles<EtatFilleul>
          valeur={etat}
          onChange={setEtat}
          pastilles={[
            { valeur: null, label: "Tous", nombre: n?.tous },
            { valeur: "en_attente", label: "En attente", nombre: n?.en_attente },
            { valeur: "a_commande", label: "A commandé, non qualifié", nombre: n?.a_commande },
            { valeur: "qualifie", label: "Qualifiés", nombre: n?.qualifie },
            { valeur: "annule", label: "Annulés", nombre: n?.annule },
          ]}
        />
        <ReferralRecherche placeholder="Filleul ou parrain…" onChercher={setSearch} />
      </div>

      <div
        className={`bg-white border border-[#E4E4E7] rounded-xl overflow-hidden transition-opacity ${
          isPlaceholderData ? "opacity-50" : ""
        }`}
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px]">
            <thead>
              <tr className="text-[11px] uppercase tracking-wide text-[#9796A1] bg-[#FAFAFA] text-left">
                <th className="py-2.5 px-3 font-medium">Filleul</th>
                <th className="py-2.5 px-3 font-medium">Parrain</th>
                <th className="py-2.5 px-3 font-medium">Inscrit le</th>
                <th className="py-2.5 px-3 font-medium">Cadeau</th>
                <th className="py-2.5 px-3 font-medium">Statut</th>
                <th className="py-2.5 px-3 font-medium text-right">Ventes</th>
                <th className="py-2.5 px-3 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center">
                    <span className="inline-flex items-center gap-2 text-sm text-[#9796A1]">
                      <Loader2 size={16} className="animate-spin" /> Chargement…
                    </span>
                  </td>
                </tr>
              ) : isError ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-sm text-red-500">
                    {(error as Error)?.message ?? "Erreur de chargement"}
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-sm text-[#9796A1]">
                    Aucun filleul ne correspond à ces filtres.
                  </td>
                </tr>
              ) : (
                items.map((f) => <Ligne key={f.id} f={f} onOuvrirFiche={onOuvrirFiche} />)
              )}
            </tbody>
          </table>
        </div>
      </div>

      {data && data.totalPages > 1 && (
        <Pagination
          currentPage={page}
          totalPages={data.totalPages}
          onPageChange={setPage}
          isLoading={isFetching}
        />
      )}
    </div>
  );
}
