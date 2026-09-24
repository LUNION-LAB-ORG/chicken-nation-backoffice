import React from "react";
import { MessageSquareWarning } from "lucide-react";
import { Bar, CartesianGrid, Cell, ComposedChart, Line, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import StatsChartCard from "@/components/gestion/Statistiques/shared/StatsChartCard";
import ChartTooltip from "@/components/gestion/Statistiques/shared/ChartTooltip";
import { AXIS_STYLE, CHART_COLORS, GRID_STYLE } from "../../../statistics/utils/chart-config";
import { IPareto } from "../../types/analyse.type";
import { fmtPct } from "../../utils/prospect-ui";

const court = (t: string) => (t.length > 16 ? `${t.slice(0, 15)}…` : t);

/**
 * Pareto des raisons de non-achat (cahier §7) : les barres pleines sont les
 * quelques blocages qui expliquent 80 % des refus, ceux à traiter en premier.
 */
export function Pareto({ pareto }: { pareto: IPareto }) {
  const principales = pareto.raisons.filter((r) => r.principale).map((r) => r.raison);
  return (
    <StatsChartCard
      title="Pourquoi ils ne commandent pas"
      subtitle={
        pareto.total === 0
          ? "Aucun refus motivé sur la période"
          : `${pareto.total} refus motivés · ${principales.length} raison${principales.length > 1 ? "s" : ""} font 80 %`
      }
      icon={MessageSquareWarning}
    >
      {pareto.total === 0 ? (
        <p className="text-sm text-gray-400 py-10 text-center">Les raisons saisies par les agents apparaîtront ici.</p>
      ) : (
        <>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={pareto.raisons} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid {...GRID_STYLE} />
                <XAxis dataKey="raison" tickFormatter={court} interval={0} {...AXIS_STYLE} />
                <YAxis yAxisId="n" allowDecimals={false} {...AXIS_STYLE} />
                <YAxis yAxisId="p" orientation="right" domain={[0, 100]} unit=" %" {...AXIS_STYLE} />
                <Tooltip content={<ChartTooltip valueFormatter={(v, nom) => (nom === "Cumul" ? fmtPct(v) : String(v))} />} />
                <ReferenceLine yAxisId="p" y={80} stroke={CHART_COLORS.textMuted} strokeDasharray="4 4" />
                <Bar yAxisId="n" dataKey="nombre" name="Prospects" radius={[4, 4, 0, 0]}>
                  {pareto.raisons.map((r) => (
                    <Cell key={r.id} fill={CHART_COLORS.primary} fillOpacity={r.principale ? 1 : 0.35} />
                  ))}
                </Bar>
                <Line yAxisId="p" dataKey="cumul" name="Cumul" stroke={CHART_COLORS.blue} strokeWidth={2} dot={{ r: 3 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          {principales.length > 0 && (
            <p className="text-xs text-gray-600 mt-3">
              À traiter en priorité : <strong>{principales.join(", ")}</strong>.
            </p>
          )}
        </>
      )}
    </StatsChartCard>
  );
}
