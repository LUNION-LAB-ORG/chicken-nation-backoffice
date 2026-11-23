"use client";

import React from "react";
import { X } from "lucide-react";
import type { AuditLog } from "../../../../features/audit/types/audit.types";

const fmt = (iso: string) =>
  new Date(iso).toLocaleString("fr-FR", { dateStyle: "long", timeStyle: "medium" });

const Row = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="flex items-start justify-between gap-4 py-2.5 border-b border-hex-f1f3f5 last:border-0">
    <span className="text-[13px] font-medium text-[#9796A1] shrink-0">{label}</span>
    <span className="text-[13px] text-hex-18181b text-right break-all">{value ?? "—"}</span>
  </div>
);

/** Détail complet d'une entrée d'audit (drawer/modale). */
export default function AuditDetailModal({
  log,
  onClose,
}: {
  log: AuditLog | null;
  onClose: () => void;
}) {
  if (!log) return null;

  const status = log.status_code ?? undefined;
  const statusCls =
    status == null
      ? "text-hex-6c757d"
      : status >= 500
        ? "text-hex-c0392b"
        : status >= 400
          ? "text-hex-9a5b12"
          : "text-hex-1e8e5a";

  return (
    <div className="fixed inset-0 z-[150] flex justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative h-full w-full max-w-md bg-white shadow-2xl overflow-y-auto">
        <div className="sticky top-0 bg-white flex items-center justify-between px-5 py-4 border-b border-hex-e4e4e7">
          <h3 className="text-[16px] font-semibold text-hex-18181b">Détail de l&apos;action</h3>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-hex-f4f4f5 flex items-center justify-center hover:bg-hex-e4e4e7 cursor-pointer"
          >
            <X size={18} className="text-hex-64748b" />
          </button>
        </div>

        <div className="p-5">
          <div className="mb-4">
            <div className="text-[15px] font-semibold text-hex-18181b">
              {log.summary ?? `${log.action} ${log.module ?? ""}`}
            </div>
            <div className="text-[12px] text-[#9796A1] mt-0.5">{fmt(log.created_at)}</div>
          </div>

          <div className="rounded-xl border border-hex-f1f3f5 px-4 py-1 mb-4">
            <Row label="Auteur" value={log.actor_name ?? "Système / public"} />
            <Row label="Rôle" value={log.actor_role} />
            <Row label="Action" value={log.action} />
            <Row label="Module" value={log.module} />
            <Row label="Cible" value={log.entity_id} />
            <Row label="Méthode" value={log.method} />
            <Row
              label="Statut"
              value={<span className={`font-bold ${statusCls}`}>{status ?? "—"}</span>}
            />
            <Row label="Durée" value={log.duration_ms != null ? `${log.duration_ms} ms` : "—"} />
            <Row label="IP" value={log.ip} />
          </div>

          <div className="mb-4">
            <div className="text-[12px] font-medium text-[#9796A1] mb-1">Chemin</div>
            <div className="rounded-lg bg-hex-fafafa px-3 py-2 text-[12px] font-mono text-hex-18181b break-all">
              <span className="text-[#F17922] font-semibold">{log.method}</span> {log.path}
            </div>
          </div>

          {log.user_agent && (
            <div className="mb-4">
              <div className="text-[12px] font-medium text-[#9796A1] mb-1">Navigateur</div>
              <div className="rounded-lg bg-hex-fafafa px-3 py-2 text-[11px] text-hex-71717a break-all">
                {log.user_agent}
              </div>
            </div>
          )}

          {log.metadata && Object.keys(log.metadata).length > 0 && (
            <div>
              <div className="text-[12px] font-medium text-[#9796A1] mb-1">
                Données envoyées (secrets masqués)
              </div>
              <pre className="rounded-lg bg-[#0F172A] text-[#E2E8F0] px-3 py-3 text-[11px] leading-relaxed overflow-x-auto">
                {JSON.stringify(log.metadata, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
