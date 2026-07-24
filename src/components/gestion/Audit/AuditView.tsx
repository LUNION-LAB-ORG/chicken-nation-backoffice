"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Search,
} from "lucide-react";
import DashboardPageHeader from "@/components/ui/DashboardPageHeader";
import {
  useAuditFiltersQuery,
  useAuditLogsQuery,
} from "../../../../features/audit/queries/audit.queries";
import type { AuditLog, AuditView as ViewMode } from "../../../../features/audit/types/audit.types";
import AuditDetailModal from "./AuditDetailModal";

const PAGE_SIZE = 25;

const ACTION_BADGE: Record<string, string> = {
  CREATE: "bg-[#E6F4EC] text-[#1E8E5A]",
  UPDATE: "bg-[#E7F0FB] text-[#2B6CB0]",
  DELETE: "bg-[#FDECEA] text-[#C0392B]",
  LOGIN: "bg-[#F3E8FF] text-[#7C3AED]",
  READ: "bg-[#F1F3F5] text-[#6C757D]",
  OTHER: "bg-[#F1F3F5] text-[#6C757D]",
};

const statusColor = (s: number | null) =>
  s == null
    ? "text-[#9796A1]"
    : s >= 500
      ? "text-[#C0392B]"
      : s >= 400
        ? "text-[#9A5B12]"
        : "text-[#1E8E5A]";

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

const selectCls =
  "h-9 rounded-lg border border-[#E4E4E7] bg-white px-2.5 text-[13px] text-[#18181B] focus:outline-none focus:ring-2 focus:ring-[#F17922]/30";

/**
 * Vue du journal d'audit, partagée par « Actions » et « Logs » (prop `view`).
 *  - view=actions : les mutations réussies du personnel (audit métier) ;
 *  - view=logs    : tout ce qui est capturé, erreurs comprises (angle technique).
 */
export default function AuditView({
  view,
  title,
  subtitle,
}: {
  view: ViewMode;
  title: string;
  subtitle: string;
}) {
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [module, setModule] = useState("");
  const [action, setAction] = useState("");
  const [method, setMethod] = useState("");
  const [actorId, setActorId] = useState("");
  const [errorsOnly, setErrorsOnly] = useState(false);
  const [selected, setSelected] = useState<AuditLog | null>(null);

  // Debounce de la recherche (400 ms) → pas de requête à chaque frappe.
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  // Tout changement de filtre ramène à la page 1.
  useEffect(() => setPage(1), [module, action, method, actorId, errorsOnly, view]);

  const { data: filters } = useAuditFiltersQuery();
  const { data, isLoading, isFetching, refetch } = useAuditLogsQuery({
    view,
    page,
    limit: PAGE_SIZE,
    search: search || undefined,
    module: module || undefined,
    action: action || undefined,
    method: method || undefined,
    actor_id: actorId || undefined,
    errors_only: view === "logs" && errorsOnly ? true : undefined,
  });

  const logs = data?.data ?? [];
  const meta = data?.meta;
  const totalPages = meta?.totalPages ?? 1;

  const actionOptions = useMemo(
    () => ["CREATE", "UPDATE", "DELETE", "LOGIN", ...(view === "logs" ? ["READ", "OTHER"] : [])],
    [view],
  );

  return (
    <div className="flex-1 overflow-auto p-4 space-y-4">
      <div className="-mt-10">
        <DashboardPageHeader mode="list" title={title} subtitle={subtitle} />
      </div>

      {/* Filtres */}
      <div className="bg-white border border-[#E4E4E7] rounded-xl p-4 flex flex-wrap items-center gap-2.5">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9796A1]" />
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Rechercher (auteur, chemin, cible…)"
            className="w-full h-9 rounded-lg border border-[#E4E4E7] bg-white pl-9 pr-3 text-[13px] focus:outline-none focus:ring-2 focus:ring-[#F17922]/30"
          />
        </div>

        <select value={actorId} onChange={(e) => setActorId(e.target.value)} className={selectCls} aria-label="Auteur">
          <option value="">Tous les auteurs</option>
          {(filters?.actors ?? []).map((a) => (
            <option key={a.id} value={a.id}>
              {a.name ?? a.id.slice(0, 8)}
            </option>
          ))}
        </select>

        <select value={module} onChange={(e) => setModule(e.target.value)} className={selectCls} aria-label="Module">
          <option value="">Tous les modules</option>
          {(filters?.modules ?? []).map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>

        <select value={action} onChange={(e) => setAction(e.target.value)} className={selectCls} aria-label="Action">
          <option value="">Toutes les actions</option>
          {actionOptions.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>

        {view === "logs" && (
          <>
            <select value={method} onChange={(e) => setMethod(e.target.value)} className={selectCls} aria-label="Méthode">
              <option value="">Toutes méthodes</option>
              {["GET", "POST", "PATCH", "PUT", "DELETE"].map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => setErrorsOnly((v) => !v)}
              className={`inline-flex items-center gap-1.5 h-9 rounded-lg px-3 text-[13px] font-medium cursor-pointer border ${
                errorsOnly
                  ? "bg-[#FDECEA] text-[#C0392B] border-[#F5C6C0]"
                  : "bg-white text-[#71717A] border-[#E4E4E7] hover:bg-[#FAFAFA]"
              }`}
            >
              <AlertTriangle size={14} /> Erreurs
            </button>
          </>
        )}

        <button
          type="button"
          onClick={() => refetch()}
          className="inline-flex items-center gap-1.5 h-9 rounded-lg border border-[#E4E4E7] bg-white px-3 text-[13px] text-[#71717A] hover:bg-[#FAFAFA] cursor-pointer"
        >
          <RefreshCw size={14} className={isFetching ? "animate-spin" : ""} /> Actualiser
        </button>
      </div>

      {/* Table */}
      <div className="bg-white border border-[#E4E4E7] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-[13px]">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wide text-[#9796A1] bg-[#FAFAFA] border-b border-[#F1F3F5]">
                <th className="py-2.5 px-4 font-medium">Quand</th>
                <th className="py-2.5 px-3 font-medium">Auteur</th>
                <th className="py-2.5 px-3 font-medium">Action</th>
                <th className="py-2.5 px-3 font-medium">Module</th>
                <th className="py-2.5 px-3 font-medium">Cible</th>
                {view === "logs" && <th className="py-2.5 px-3 font-medium">Méthode</th>}
                {view === "logs" && <th className="py-2.5 px-3 font-medium text-center">Statut</th>}
                {view === "logs" && <th className="py-2.5 px-3 font-medium text-right">Durée</th>}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-[#9796A1]">
                    Chargement…
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-[#9796A1]">
                    Aucune entrée pour ces filtres.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr
                    key={log.id}
                    onClick={() => setSelected(log)}
                    className="border-b border-[#F7F7F8] last:border-0 hover:bg-[#FFF9F4] cursor-pointer"
                  >
                    <td className="py-2.5 px-4 whitespace-nowrap text-[#71717A]">
                      {fmtDate(log.created_at)}
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="font-medium text-[#18181B]">
                        {log.actor_name ?? "Système"}
                      </div>
                      {log.actor_role && (
                        <div className="text-[11px] text-[#9796A1]">{log.actor_role}</div>
                      )}
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          ACTION_BADGE[log.action] ?? ACTION_BADGE.OTHER
                        }`}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-[#18181B]">{log.module ?? "—"}</td>
                    <td className="py-2.5 px-3 text-[#71717A] max-w-[220px] truncate">
                      {log.entity_id ? (
                        <span className="font-mono text-[12px]">#{log.entity_id.slice(0, 8)}</span>
                      ) : (
                        <span className="font-mono text-[12px] text-[#B4B4BB]">{log.path}</span>
                      )}
                    </td>
                    {view === "logs" && (
                      <td className="py-2.5 px-3 font-mono text-[12px] text-[#71717A]">
                        {log.method}
                      </td>
                    )}
                    {view === "logs" && (
                      <td className={`py-2.5 px-3 text-center font-bold ${statusColor(log.status_code)}`}>
                        {log.status_code ?? "—"}
                      </td>
                    )}
                    {view === "logs" && (
                      <td className="py-2.5 px-3 text-right text-[#9796A1] whitespace-nowrap">
                        {log.duration_ms != null ? `${log.duration_ms} ms` : "—"}
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {meta && meta.total > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-[#F1F3F5]">
            <span className="text-[12px] text-[#9796A1]">
              {meta.total.toLocaleString("fr-FR")} entrée(s) · page {meta.page}/{totalPages}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="inline-flex items-center gap-1 h-8 rounded-lg border border-[#E4E4E7] px-2.5 text-[12px] text-[#71717A] disabled:opacity-40 hover:bg-[#FAFAFA] cursor-pointer disabled:cursor-default"
              >
                <ChevronLeft size={14} /> Précédent
              </button>
              <button
                type="button"
                disabled={!meta.hasMore}
                onClick={() => setPage((p) => p + 1)}
                className="inline-flex items-center gap-1 h-8 rounded-lg border border-[#E4E4E7] px-2.5 text-[12px] text-[#71717A] disabled:opacity-40 hover:bg-[#FAFAFA] cursor-pointer disabled:cursor-default"
              >
                Suivant <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      <AuditDetailModal log={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
