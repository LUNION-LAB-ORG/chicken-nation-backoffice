"use client";

import React from "react";
import { ITypeClicksStat } from "../../../../features/analytics/types/analytics.type";
import { deeplinkTypeMeta } from "@/components/gestion/Marketing/deeplink-types";

interface Props {
  byType?: ITypeClicksStat[];
  isLoading?: boolean;
}

/**
 * Répartition des clics deeplink par type (plats, catégories, carte nation…).
 * C'est l'info de décision : ce que les utilisateurs cliquent le plus.
 */
export function DeeplinkTypeBreakdown({ byType, isLoading }: Props) {
  const rows = React.useMemo(
    () => [...(byType ?? [])].sort((a, b) => b.count - a.count),
    [byType],
  );
  const total = rows.reduce((s, r) => s + r.count, 0);
  const max = rows.reduce((m, r) => Math.max(m, r.count), 0) || 1;

  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-base font-semibold text-slate-800">
            Répartition par type de deeplink
          </h3>
          <p className="text-xs text-slate-400">
            Ce que les utilisateurs cliquent le plus
          </p>
        </div>
        <span className="text-xs font-medium text-slate-400 whitespace-nowrap">
          {total.toLocaleString()} clic(s)
        </span>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-2.5 rounded-full bg-slate-100 animate-pulse" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <p className="text-sm text-slate-400 py-8 text-center">
          Aucune donnée pour l&apos;instant — les prochains clics seront catégorisés.
        </p>
      ) : (
        <div className="space-y-3.5">
          {rows.map((r) => {
            const meta = deeplinkTypeMeta(r.type);
            const pct = total ? Math.round((r.count / total) * 100) : 0;
            return (
              <div key={r.type} className="flex items-center gap-3">
                <span className="w-32 shrink-0 flex items-center gap-2 text-sm text-slate-600">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: meta.color }}
                  />
                  <span className="truncate">{meta.label}</span>
                </span>
                <div className="flex-1 h-2.5 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${(r.count / max) * 100}%`,
                      backgroundColor: meta.color,
                    }}
                  />
                </div>
                <span className="w-24 shrink-0 text-right text-sm text-slate-700 tabular-nums">
                  {r.count.toLocaleString()}{" "}
                  <span className="text-slate-400">({pct}%)</span>
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
