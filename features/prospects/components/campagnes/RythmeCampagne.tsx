import React from "react";
import { Activity } from "lucide-react";
import { Bar, CartesianGrid, ComposedChart, Legend, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import StatsChartCard from "@/components/gestion/Statistiques/shared/StatsChartCard";
import ChartTooltip from "@/components/gestion/Statistiques/shared/ChartTooltip";
import { AXIS_STYLE, CHART_COLORS, GRID_STYLE } from "../../../statistics/utils/chart-config";
import { ICampagneStats } from "../../types/campagne.type";

const court = (jour: string) => jour.slice(8, 10) + "/" + jour.slice(5, 7);

/** Rythme quotidien réalisé contre objectif, en cumulé (cahier §6.3). */
export function RythmeCampagne({ rythme }: { rythme: ICampagneStats["rythme"] }) {
  const sousTitre = rythme.objectif_jour
    ? `Objectif : ${String(rythme.objectif_jour).replace(".", ",")} prospects traités par jour`
    : "Aucun objectif de volume n'a été fixé";

  return (
    <StatsChartCard title="Rythme quotidien" subtitle={sousTitre} icon={Activity}>
      {rythme.serie.length === 0 ? (
        <p className="text-sm text-gray-400 py-10 text-center">La campagne n&apos;a pas encore commencé.</p>
      ) : (
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={rythme.serie} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid {...GRID_STYLE} />
              <XAxis dataKey="jour" tickFormatter={court} {...AXIS_STYLE} />
              <YAxis allowDecimals={false} {...AXIS_STYLE} />
              <Tooltip content={<ChartTooltip labelFormatter={court} />} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="traites" name="Traités du jour" fill={CHART_COLORS.primary} radius={[4, 4, 0, 0]} />
              <Bar dataKey="conversions" name="Conversions du jour" fill={CHART_COLORS.success} radius={[4, 4, 0, 0]} />
              <Line type="monotone" dataKey="cumul" name="Traités cumulés" stroke={CHART_COLORS.blue} strokeWidth={2} dot={false} />
              {rythme.objectif_jour && (
                <Line
                  type="monotone"
                  dataKey="objectif_cumul"
                  name="Objectif cumulé"
                  stroke={CHART_COLORS.textMuted}
                  strokeDasharray="5 4"
                  strokeWidth={2}
                  dot={false}
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
    </StatsChartCard>
  );
}
