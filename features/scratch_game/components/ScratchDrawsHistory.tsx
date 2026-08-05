"use client";

import React, { useState } from "react";
import { ChevronLeft, ChevronRight, History } from "lucide-react";
import { useScratchDrawsQuery, useScratchLotsQuery } from "../queries/scratch.queries";
import { ScratchDraw, ScratchDrawStatut } from "../types/scratch.types";

/**
 * Historique des tirages : qui a gagné quoi, sur quelle commande, et ce que
 * le gain est devenu (gratté, utilisé, expiré, révoqué).
 */

const STATUTS: Record<ScratchDrawStatut, { label: string; cls: string }> = {
  A_GRATTER: { label: "À gratter", cls: "bg-gray-100 text-gray-700" },
  GRATTE: { label: "Gratté", cls: "bg-blue-50 text-blue-700" },
  UTILISE: { label: "Utilisé", cls: "bg-green-50 text-green-700" },
  REVOQUE: { label: "Révoqué", cls: "bg-red-50 text-red-600" },
  EXPIRE: { label: "Expiré", cls: "bg-amber-50 text-amber-700" },
  SANS_GAIN: { label: "Sans gain", cls: "bg-gray-100 text-gray-500" },
};

const fmtDate = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

export default function ScratchDrawsHistory() {
  const [page, setPage] = useState(1);
  const [lotId, setLotId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const { data: lots = [] } = useScratchLotsQuery();
  const { data, isLoading, isFetching } = useScratchDrawsQuery({
    page,
    limit: 20,
    lotId: lotId || undefined,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
  });

  const draws = data?.data ?? [];
  const meta = data?.meta;

  const resetPage = () => setPage(1);

  return (
    <div className="space-y-4">
      {/* Filtres */}
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Lot</label>
          <select
            className="h-10 rounded-lg border border-gray-200 px-3 text-sm bg-white min-w-44 cursor-pointer"
            value={lotId}
            onChange={(e) => { setLotId(e.target.value); resetPage(); }}
          >
            <option value="">Tous les lots</option>
            {lots.filter((l) => !l.is_floor).map((l) => (
              <option key={l.id} value={l.id}>{l.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Du</label>
          <input
            type="date"
            className="h-10 rounded-lg border border-gray-200 px-3 text-sm bg-white"
            value={startDate}
            onChange={(e) => { setStartDate(e.target.value); resetPage(); }}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Au</label>
          <input
            type="date"
            className="h-10 rounded-lg border border-gray-200 px-3 text-sm bg-white"
            value={endDate}
            onChange={(e) => { setEndDate(e.target.value); resetPage(); }}
          />
        </div>
        {meta && (
          <div className="ml-auto text-sm text-gray-500 pb-2">
            {meta.total} tirage{meta.total > 1 ? "s" : ""}
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-400">
                <th className="px-4 py-3 font-semibold">Date</th>
                <th className="px-4 py-3 font-semibold">Lot</th>
                <th className="px-4 py-3 font-semibold">Client</th>
                <th className="px-4 py-3 font-semibold">Commande d'origine</th>
                <th className="px-4 py-3 font-semibold">Statut</th>
                <th className="px-4 py-3 font-semibold">Gratté le</th>
                <th className="px-4 py-3 font-semibold">Utilisé</th>
                <th className="px-4 py-3 font-semibold text-right">Coût</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={8} className="px-4 py-3">
                      <div className="h-5 bg-gray-100 rounded animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : draws.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-gray-400">
                    <History size={28} className="mx-auto mb-2 opacity-40" />
                    Aucun tirage sur cette période
                  </td>
                </tr>
              ) : (
                draws.map((d: ScratchDraw) => {
                  const st = STATUTS[d.statut] ?? STATUTS.SANS_GAIN;
                  return (
                    <tr key={d.id} className="hover:bg-gray-50/60">
                      <td className="px-4 py-3 whitespace-nowrap text-gray-600">
                        {fmtDate(d.date_tirage)}
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-medium text-gray-900">
                          {d.lot?.label ?? "Lot supprimé"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-gray-900">{d.client?.name || "Client"}</div>
                        {d.client?.phone && (
                          <div className="text-xs text-gray-400">{d.client.phone}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap font-mono text-xs text-gray-600">
                        {d.commande_origine?.reference ?? "?"}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${st.cls}`}>
                          {st.label}
                        </span>
                        {d.stock_restaure && (
                          <span className="ml-1.5 inline-flex px-2 py-1 rounded-full text-[10px] bg-gray-100 text-gray-500">
                            stock restitué
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-gray-600">
                        {fmtDate(d.gratte_le) ?? "..."}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {d.utilise_le ? (
                          <div>
                            <div className="text-gray-600">{fmtDate(d.utilise_le)}</div>
                            {d.commande_utilisation && (
                              <div className="font-mono text-xs text-gray-400">
                                {d.commande_utilisation.reference}
                              </div>
                            )}
                          </div>
                        ) : d.statut === "EXPIRE" && d.expire_le ? (
                          <span className="text-xs text-amber-600">
                            expiré le {fmtDate(d.expire_le)}
                          </span>
                        ) : (
                          <span className="text-gray-300">...</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap font-medium text-gray-900">
                        {d.cout.toLocaleString("fr-FR")} F
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {meta && meta.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-50">
            <span className="text-xs text-gray-400">
              Page {meta.page} sur {meta.totalPages}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={page <= 1 || isFetching}
                onClick={() => setPage((p) => p - 1)}
                className="p-2 rounded-lg border border-gray-200 disabled:opacity-40 hover:border-[#F17922]/50 cursor-pointer"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                type="button"
                disabled={page >= meta.totalPages || isFetching}
                onClick={() => setPage((p) => p + 1)}
                className="p-2 rounded-lg border border-gray-200 disabled:opacity-40 hover:border-[#F17922]/50 cursor-pointer"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
