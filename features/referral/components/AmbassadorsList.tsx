"use client";

import React, { useState } from "react";
import { Pagination } from "@/components/ui/pagination";
import SimpleSelect from "@/components/ui/SimpleSelect";
import { Eye, Loader2, UserPlus, Wallet } from "lucide-react";
import { StatsFilters } from "../../statistics/filters/statistics.filters";
import { usePageSelonFiltres } from "../hooks/usePageSelonFiltres";
import { useAmbassadorsQuery } from "../queries/referral.queries";
import { Ambassador, EtatParrain, TriParrain } from "../types/referral.types";
import { fcfa, shortDate } from "../utils/format";
import NouveauParrainModal from "./NouveauParrainModal";
import ReferralPastilles from "./ReferralPastilles";
import ReferralRecherche from "./ReferralRecherche";
import { useAuthStore } from "../../users/hook/authStore";
import { Action, Modules } from "../../users/types/auth.type";

const LIMIT = 10;

const TRIS: { value: TriParrain; label: string }[] = [
  { value: "filleuls", label: "Filleuls" },
  { value: "qualifies", label: "Filleuls qualifiés" },
  { value: "dernier_filleul", label: "Dernier filleul" },
  { value: "ventes", label: "Ventes générées" },
  { value: "en_attente", label: "En attente" },
  { value: "payable", label: "Payable" },
  { value: "paye", label: "Déjà payé" },
];

const Row: React.FC<{
  a: Ambassador;
  onOpen: (id: string) => void;
  peutVerser: boolean;
}> = ({ a, onOpen, peutVerser }) => (
  <tr className="border-b border-[#F2F2F4] last:border-0 hover:bg-[#FAFAFA]">
    <td className="py-3 px-3">
      <div className="text-sm font-medium text-[#18181B]">{a.fullname ?? "Sans nom"}</div>
      <div className="text-xs text-[#9796A1]">{a.phone}</div>
      {a.referral_code && (
        <span className="inline-block mt-0.5 text-[10px] font-semibold text-[#F17922]">
          {a.referral_code}
        </span>
      )}
    </td>
    <td className="py-3 px-3 text-center text-sm text-[#18181B]">
      {a.qualified_referees_count}
      <span className="text-[#9796A1]">/{a.referees_count}</span>
      {a.last_referee_at && (
        <div className="text-[11px] text-[#9796A1] whitespace-nowrap">
          dernier le {shortDate(a.last_referee_at)}
        </div>
      )}
    </td>
    <td className="py-3 px-3 text-right text-sm text-[#18181B] whitespace-nowrap">
      {fcfa(a.generated_sales)}
    </td>
    <td className="py-3 px-3 text-right text-sm text-[#B45309] whitespace-nowrap">
      {fcfa(a.pending_amount)}
    </td>
    <td className="py-3 px-3 text-right text-sm font-semibold text-[#0369A1] whitespace-nowrap">
      {fcfa(a.payable_amount)}
    </td>
    <td className="py-3 px-3 text-right text-sm text-[#1E8E5A] whitespace-nowrap">
      {fcfa(a.paid_amount)}
    </td>
    <td className="py-3 px-3 text-right">
      <button
        type="button"
        onClick={() => onOpen(a.customer_id)}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-[#F17922] border border-[#F17922]/30 rounded-lg px-3 py-1.5 hover:bg-[#FFF6E9] cursor-pointer"
      >
        {/* Sans FIDELITE UPDATE, la fenêtre n'affiche que les soldes et
            l'historique : « Gérer » promettrait un geste impossible. */}
        {peutVerser ? (
          <>
            <Wallet size={15} /> Gérer
          </>
        ) : (
          <>
            <Eye size={15} /> Détails
          </>
        )}
      </button>
    </td>
  </tr>
);

export default function AmbassadorsList({
  filtres,
  etatInitial,
  triInitial,
  onOuvrirFiche,
}: {
  filtres: StatsFilters;
  etatInitial?: EtatParrain;
  triInitial?: TriParrain;
  onOuvrirFiche: (id: string) => void;
}) {
  const [search, setSearch] = useState("");
  const [etat, setEtat] = useState<EtatParrain | null>(etatInitial ?? null);
  const [tri, setTri] = useState<TriParrain>(triInitial ?? "filleuls");
  const [ajout, setAjout] = useState(false);
  const [page, setPage] = usePageSelonFiltres({ filtres, search, etat, tri });
  const peutVerser = useAuthStore((s) => s.can(Modules.FIDELITE, Action.UPDATE));

  const { data, isLoading, isError, error, isFetching, isPlaceholderData } = useAmbassadorsQuery({
    page,
    limit: LIMIT,
    search: search || undefined,
    etat: etat ?? undefined,
    tri,
    filtres,
  });

  const items = data?.items ?? [];
  const n = data?.compteurs;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-sm text-[#9796A1]">
          Tous les parrains : filleuls, ventes générées, solde à verser.
        </p>
        <div className="flex items-center gap-2 flex-wrap">
          <ReferralRecherche placeholder="Nom, téléphone, code…" onChercher={setSearch} />
          {peutVerser && (
            <button
              type="button"
              onClick={() => setAjout(true)}
              className="h-10 flex items-center gap-1.5 px-4 rounded-lg border border-[#F17922]/30 text-[#F17922] text-sm font-medium hover:bg-[#FFF6E9] cursor-pointer"
            >
              <UserPlus size={15} /> Ajouter un parrain
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <ReferralPastilles<EtatParrain>
          valeur={etat}
          onChange={setEtat}
          pastilles={[
            { valeur: null, label: "Tous", nombre: n?.tous },
            { valeur: "avec_filleuls", label: "Avec filleuls", nombre: n?.avec_filleuls },
            { valeur: "sans_filleul", label: "Sans filleul", nombre: n?.sans_filleul },
            { valeur: "qualifies", label: "Avec qualifiés", nombre: n?.qualifies },
            { valeur: "en_attente", label: "En attente", nombre: n?.en_attente },
            { valeur: "payable", label: "Payable", nombre: n?.payable },
            { valeur: "paye", label: "Déjà payé", nombre: n?.paye },
          ]}
        />
        <div className="flex items-center gap-2">
          <span className="text-sm text-[#71717A] whitespace-nowrap">Trier par</span>
          <div className="w-48">
            <SimpleSelect options={TRIS} value={tri} onChange={(v) => setTri(v as TriParrain)} />
          </div>
        </div>
      </div>

      <div
        className={`bg-white border border-[#E4E4E7] rounded-xl overflow-hidden transition-opacity ${
          isPlaceholderData ? "opacity-50" : ""
        }`}
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px]">
            <thead>
              <tr className="text-[11px] uppercase tracking-wide text-[#9796A1] bg-[#FAFAFA] text-left">
                <th className="py-2.5 px-3 font-medium">Ambassadeur</th>
                <th className="py-2.5 px-3 font-medium text-center">Filleuls qualifiés</th>
                <th className="py-2.5 px-3 font-medium text-right">Ventes générées</th>
                <th className="py-2.5 px-3 font-medium text-right">En attente</th>
                <th className="py-2.5 px-3 font-medium text-right">Payable</th>
                <th className="py-2.5 px-3 font-medium text-right">Déjà payé</th>
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
                    {search || etat
                      ? "Aucun parrain ne correspond à ces filtres."
                      : "Aucun ambassadeur pour le moment."}
                  </td>
                </tr>
              ) : (
                items.map((a) => (
                  <Row
                    key={a.customer_id}
                    a={a}
                    onOpen={onOuvrirFiche}
                    peutVerser={peutVerser}
                  />
                ))
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

      <NouveauParrainModal
        key={ajout ? "ouverte" : "fermee"}
        isOpen={ajout}
        onClose={() => setAjout(false)}
        onCreated={(id) => {
          setAjout(false);
          onOuvrirFiche(id);
        }}
      />
    </div>
  );
}
