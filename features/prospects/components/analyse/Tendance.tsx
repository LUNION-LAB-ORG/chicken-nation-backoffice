import React from "react";
import { TrendingUp } from "lucide-react";
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import StatsChartCard from "@/components/gestion/Statistiques/shared/StatsChartCard";
import ChartTooltip from "@/components/gestion/Statistiques/shared/ChartTooltip";
import { AXIS_STYLE, CHART_COLORS, GRID_STYLE } from "../../../statistics/utils/chart-config";
import { ITendanceJour } from "../../types/analyse.type";

const court = (jour: string) => `${jour.slice(8, 10)}/${jour.slice(5, 7)}`;

const SERIES = [
  { cle: "appels", nom: "Appels", couleur: CHART_COLORS.blue },
  { cle: "joints", nom: "Joints", couleur: CHART_COLORS.purple },
  { cle: "coupons", nom: "Coupons", couleur: CHART_COLORS.primary },
  { cle: "conversions", nom: "Conversions", couleur: CHART_COLORS.success },
  { cle: "inscriptions", nom: "Inscriptions", couleur: CHART_COLORS.textMuted },
] as const;

/** Activité jour par jour sur la période (30 derniers jours par défaut). */
export function Tendance({ serie }: { serie: ITendanceJour[] }) {
  return (
    <StatsChartCard title="Activité quotidienne" subtitle="Appels, coupons et conversions jour par jour" icon={TrendingUp}>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={serie} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid {...GRID_STYLE} />
            <XAxis dataKey="jour" tickFormatter={court} minTickGap={16} {...AXIS_STYLE} />
            <YAxis allowDecimals={false} {...AXIS_STYLE} />
            <Tooltip content={<ChartTooltip labelFormatter={court} />} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            {SERIES.map((s) => (
              <Line key={s.cle} type="monotone" dataKey={s.cle} name={s.nom} stroke={s.couleur} strokeWidth={2} dot={false} />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </StatsChartCard>
  );
}
