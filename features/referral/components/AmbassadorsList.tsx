"use client";

import React, { useState } from "react";
import { Pagination } from "@/components/ui/pagination";
import { Loader2, Search, Users, Wallet } from "lucide-react";
import { useAmbassadorsQuery } from "../queries/referral.queries";
import { Ambassador } from "../types/referral.types";
import { fcfa } from "../utils/format";
import AmbassadorPayoutModal from "./AmbassadorPayoutModal";

const LIMIT = 10;

const Row: React.FC<{ a: Ambassador; onOpen: (id: string) => void }> = ({
  a,
  onOpen,
}) => (
  <tr className="border-b border-[#F2F2F4] last:border-0 hover:bg-[#FAFAFA]">
    <td className="py-3 px-3">
      <div className="text-sm font-medium text-[#18181B]">{a.fullname ?? "—"}</div>
      <div className="text-xs text-[#9796A1]">{a.phone ?? "—"}</div>
      {a.referral_code && (
        <span className="inline-block mt-0.5 text-[10px] font-semibold text-[#F17922]">
          {a.referral_code}
        </span>
      )}
    </td>
    <td className="py-3 px-3 text-center text-sm text-[#18181B]">
      {a.qualified_referees_count}
      <span className="text-[#9796A1]">/{a.referees_count}</span>
    </td>
    <td className="py-3 px-3 text-right text-sm text-[#18181B] whitespace-nowrap">
      {fcfa(a.generated_sales)}
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
        <Wallet size={15} /> Gérer
      </button>
    </td>
  </tr>
);

export default function AmbassadorsList() {
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  const { data, isLoading, isError, error, isFetching } = useAmbassadorsQuery({
    page,
    limit: LIMIT,
    search: search || undefined,
  });

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  };

  const items = data?.items ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-[18px] font-semibold text-[#F17922] flex items-center gap-2">
            <Users size={18} /> Ambassadeurs
          </h2>
          <p className="text-sm text-[#9796A1]">
            Parrains rémunérés : filleuls, ventes générées, solde à verser.
          </p>
        </div>
        <form onSubmit={submitSearch} className="flex items-center gap-2">
          <div className="relative">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9796A1]"
            />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Nom, téléphone, code…"
              className="h-10 w-56 rounded-lg border border-[#E4E4E7] pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#F17922]/30"
            />
          </div>
          <button
            type="submit"
            className="h-10 px-4 rounded-lg bg-[#F17922] text-white text-sm font-medium hover:bg-[#e06816] cursor-pointer"
          >
            Chercher
          </button>
        </form>
      </div>

      <div className="bg-white border border-[#E4E4E7] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px]">
            <thead>
              <tr className="text-[11px] uppercase tracking-wide text-[#9796A1] bg-[#FAFAFA] text-left">
                <th className="py-2.5 px-3 font-medium">Ambassadeur</th>
                <th className="py-2.5 px-3 font-medium text-center">Filleuls qualifiés</th>
                <th className="py-2.5 px-3 font-medium text-right">Ventes générées</th>
                <th className="py-2.5 px-3 font-medium text-right">Payable</th>
                <th className="py-2.5 px-3 font-medium text-right">Déjà payé</th>
                <th className="py-2.5 px-3 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center">
                    <span className="inline-flex items-center gap-2 text-sm text-[#9796A1]">
                      <Loader2 size={16} className="animate-spin" /> Chargement…
                    </span>
                  </td>
                </tr>
              ) : isError ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-sm text-red-500">
                    {(error as Error)?.message ?? "Erreur de chargement"}
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-sm text-[#9796A1]">
                    Aucun ambassadeur pour le moment.
                  </td>
                </tr>
              ) : (
                items.map((a) => (
                  <Row key={a.customer_id} a={a} onOpen={setOpenId} />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {data && data.totalPages > 1 && (
        <Pagination
          currentPage={data.page}
          totalPages={data.totalPages}
          onPageChange={setPage}
          isLoading={isFetching}
        />
      )}

      <AmbassadorPayoutModal
        ambassadorId={openId}
        isOpen={openId !== null}
        onClose={() => setOpenId(null)}
      />
    </div>
  );
}
