"use client";

import React, { useState } from "react";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { Pagination } from "@/components/ui/pagination";
import SimpleSelect from "@/components/ui/SimpleSelect";
import { CheckCircle2, Loader2 } from "lucide-react";
import { StatsFilters } from "../../statistics/filters/statistics.filters";
import { usePageSelonFiltres } from "../hooks/usePageSelonFiltres";
import {
  useApplyThresholdMutation,
  useReferralGainsQuery,
  useReferralTableauQuery,
} from "../queries/referral.queries";
import { ReferralEarningKind, ReferralEarningStatus, ReferralGainLigne } from "../types/referral.types";
import { fcfa, pluriel, shortDate } from "../utils/format";
import { STATUT_GAIN } from "../utils/statuts";
import ReferralPastilles from "./ReferralPastilles";
import ReferralRecherche from "./ReferralRecherche";
import { useAuthStore } from "../../users/hook/authStore";
import { Action, Modules } from "../../users/types/auth.type";

const LIMIT = 10;
const TOUS_TYPES = "tous";

const Ligne: React.FC<{ g: ReferralGainLigne; onOuvrirFiche: (id: string) => void }> = ({
  g,
  onOuvrirFiche,
}) => {
  const st = STATUT_GAIN[g.status] ?? STATUT_GAIN.PENDING;
  return (
    <tr className="border-b border-[#F2F2F4] last:border-0 hover:bg-[#FAFAFA]">
      <td className="py-3 px-3">
        <div className="text-sm font-medium text-[#18181B]">{g.referrer_name ?? "Sans nom"}</div>
        {g.referrer_code && (
          <span className="text-[10px] font-semibold text-[#F17922]">{g.referrer_code}</span>
        )}
      </td>
      <td className="py-3 px-3">
        <span
          className={
            "inline-block text-[10px] font-semibold rounded-full px-2 py-0.5 " +
            (g.kind === "PRIME" ? "bg-[#FDEDD3] text-[#B45309]" : "bg-[#EEF2FF] text-[#4338CA]")
          }
        >
          {g.kind === "PRIME" ? "Prime" : "Commission"}
        </span>
      </td>
      <td className="py-3 px-3 text-sm text-[#18181B]">{g.referee_name ?? "Sans nom"}</td>
      <td className="py-3 px-3 text-xs text-[#71717A]">
        {g.order_number && <div>#{g.order_number}</div>}
        {g.order_amount != null && <div className="text-[#9796A1]">{fcfa(g.order_amount)}</div>}
      </td>
      <td className="py-3 px-3 text-right text-sm font-semibold text-[#18181B] whitespace-nowrap">
        {fcfa(g.amount)}
      </td>
      <td className="py-3 px-3">
        <span className={"text-[10px] font-semibold rounded-full px-2 py-0.5 " + st.cls}>{st.label}</span>
        {g.paid_at && (
          <div className="text-[11px] text-[#9796A1] mt-0.5 whitespace-nowrap">le {shortDate(g.paid_at)}</div>
        )}
        {g.note && <div className="text-[11px] text-[#9796A1] mt-0.5">{g.note}</div>}
      </td>
      <td className="py-3 px-3 text-xs text-[#9796A1] whitespace-nowrap">{shortDate(g.created_at)}</td>
      <td className="py-3 px-3 text-right">
        <button
          type="button"
          onClick={() => onOuvrirFiche(g.referrer_id)}
          className="text-sm font-medium text-[#F17922] border border-[#F17922]/30 rounded-lg px-3 py-1.5 hover:bg-[#FFF6E9] cursor-pointer whitespace-nowrap"
        >
          Voir le parrain
        </button>
      </td>
    </tr>
  );
};

/** Tous les gains (primes et commissions), de tous les parrains. */
export default function GainsList({
  filtres,
  statutInitial,
  onOuvrirFiche,
}: {
  filtres: StatsFilters;
  statutInitial?: ReferralEarningStatus;
  onOuvrirFiche: (id: string) => void;
}) {
  const [search, setSearch] = useState("");
  const [statut, setStatut] = useState<ReferralEarningStatus | null>(statutInitial ?? null);
  const [type, setType] = useState<ReferralEarningKind | typeof TOUS_TYPES>(TOUS_TYPES);
  const [confirmer, setConfirmer] = useState(false);
  const [page, setPage] = usePageSelonFiltres({ filtres, search, statut, type });
  const peutVerser = useAuthStore((s) => s.can(Modules.FIDELITE, Action.UPDATE));

  const { data, isLoading, isError, error, isFetching, isPlaceholderData } = useReferralGainsQuery({
    page,
    limit: LIMIT,
    search: search || undefined,
    status: statut ?? undefined,
    type: type === TOUS_TYPES ? undefined : type,
    filtres,
  });
  const soldes = useReferralTableauQuery(filtres).data?.soldes;
  const auSeuil = useApplyThresholdMutation();

  const items = data?.items ?? [];
  const n = data?.compteurs;
  const parrainsAuSeuil = soldes?.parrains_au_seuil ?? 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <ReferralPastilles<ReferralEarningStatus>
          valeur={statut}
          onChange={setStatut}
          pastilles={[
            { valeur: null, label: "Tous", nombre: n?.tous },
            { valeur: "PENDING", label: "En attente", nombre: n?.PENDING },
            { valeur: "PAYABLE", label: "Payable", nombre: n?.PAYABLE },
            { valeur: "PAID", label: "Payé", nombre: n?.PAID },
            { valeur: "CANCELLED", label: "Annulé", nombre: n?.CANCELLED },
          ]}
        />
        <div className="flex items-center gap-2 flex-wrap">
          <div className="w-44">
            <SimpleSelect
              options={[
                { value: TOUS_TYPES, label: "Tous les types" },
                { value: "PRIME", label: "Prime" },
                { value: "COMMISSION", label: "Commission" },
              ]}
              value={type}
              onChange={(v) => setType(v as ReferralEarningKind | typeof TOUS_TYPES)}
            />
          </div>
          <ReferralRecherche placeholder="Parrain ou filleul…" onChercher={setSearch} />
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-sm text-[#71717A]">
          Total : <span className="font-semibold text-[#18181B]">{fcfa(data?.montant)}</span>
        </p>
        {peutVerser && parrainsAuSeuil > 0 && (
          <button
            type="button"
            onClick={() => setConfirmer(true)}
            className="h-10 flex items-center gap-2 text-sm font-medium text-[#0369A1] border border-[#0369A1]/30 bg-white rounded-lg px-3 hover:bg-[#EAF6FF] cursor-pointer"
          >
            <CheckCircle2 size={16} />
            Passer en payable au seuil ({pluriel(parrainsAuSeuil, "parrain")})
          </button>
        )}
      </div>

      <div
        className={`bg-white border border-[#E4E4E7] rounded-xl overflow-hidden transition-opacity ${
          isPlaceholderData ? "opacity-50" : ""
        }`}
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead>
              <tr className="text-[11px] uppercase tracking-wide text-[#9796A1] bg-[#FAFAFA] text-left">
                <th className="py-2.5 px-3 font-medium">Parrain</th>
                <th className="py-2.5 px-3 font-medium">Type</th>
                <th className="py-2.5 px-3 font-medium">Filleul</th>
                <th className="py-2.5 px-3 font-medium">Commande</th>
                <th className="py-2.5 px-3 font-medium text-right">Montant</th>
                <th className="py-2.5 px-3 font-medium">Statut</th>
                <th className="py-2.5 px-3 font-medium">Date</th>
                <th className="py-2.5 px-3 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center">
                    <span className="inline-flex items-center gap-2 text-sm text-[#9796A1]">
                      <Loader2 size={16} className="animate-spin" /> Chargement…
                    </span>
                  </td>
                </tr>
              ) : isError ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-sm text-red-500">
                    {(error as Error)?.message ?? "Erreur de chargement"}
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-sm text-[#9796A1]">
                    Aucun gain ne correspond à ces filtres.
                  </td>
                </tr>
              ) : (
                items.map((g) => <Ligne key={g.id} g={g} onOuvrirFiche={onOuvrirFiche} />)
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

      <ConfirmDialog
        isOpen={confirmer}
        onClose={() => setConfirmer(false)}
        onConfirm={() => auSeuil.mutate(undefined, { onSettled: () => setConfirmer(false) })}
        title="Passer en payable au seuil ?"
        description={
          <p>
            Les gains en attente de <b>{pluriel(parrainsAuSeuil, "parrain")}</b> passent en payable : leur
            solde en attente a atteint {fcfa(soldes?.seuil)}.
          </p>
        }
        confirmLabel="Passer en payable"
        cancelLabel="Annuler"
        isLoading={auSeuil.isPending}
      />
    </div>
  );
}
