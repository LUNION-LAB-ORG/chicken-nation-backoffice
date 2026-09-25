import React, { useMemo } from "react";
import { BarChart3, TrendingUp } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import StatsChartCard from "@/components/gestion/Statistiques/shared/StatsChartCard";
import ChartTooltip from "@/components/gestion/Statistiques/shared/ChartTooltip";
import { AXIS_STYLE, CHART_COLORS, GRID_STYLE } from "../../../statistics/utils/chart-config";
import { ITendance } from "../../types/analyse.type";
import { Public } from "../../types/contact.type";
import { COULEUR_PUBLIC, PUBLIC_META, couvreCaptes, fmtDate, publicsCouverts } from "../../utils/crm-ui";

const court = (jour: string) => `${jour.slice(8, 10)}/${jour.slice(5, 7)}`;

const SERIES = [
  { cle: "entrees", nom: "Entrées", couleur: CHART_COLORS.textMuted },
  { cle: "captures", nom: "Captures", couleur: CHART_COLORS.teal },
  { cle: "appels", nom: "Appels", couleur: CHART_COLORS.blue },
  { cle: "joints", nom: "Joints", couleur: CHART_COLORS.purple },
  { cle: "coupons", nom: "Coupons", couleur: CHART_COLORS.primary },
  { cle: "conversions", nom: "Ventes", couleur: CHART_COLORS.success },
] as const;

/**
 * Activité jour par jour. Sans date de début, la série part du premier
 * passage (depuis l'ouverture, un an au plus). Avec plusieurs publics, deux
 * graphiques de plus : entrées par public (barres empilées) et ventes par
 * public (courbes).
 */
export function Tendance({ t, publics, parPublic }: { t: ITendance; publics?: Public[]; parPublic?: boolean }) {
  const cleCouverts = publicsCouverts(publics).join(",");
  const couverts = useMemo(() => cleCouverts.split(",") as Public[], [cleCouverts]);
  const captures = couvreCaptes(publics);
  const series = SERIES.filter((s) => s.cle !== "captures" || captures);
  const periode = `du ${fmtDate(t.debut)} au ${fmtDate(t.fin)}`;
  const sousTitre = t.depuis_ouverture ? `Depuis l'ouverture, un an au plus : ${periode}` : `Jour par jour, ${periode}`;

  // Les objets par public deviennent des colonnes à plat, lisibles par recharts.
  const aplat = useMemo(
    () =>
      t.serie.map((j) => {
        const ligne: Record<string, number | string> = { jour: j.jour };
        couverts.forEach((p) => {
          ligne[`e_${p}`] = j.entrees_par_public?.[p] ?? 0;
          ligne[`v_${p}`] = j.ventes_par_public?.[p] ?? 0;
        });
        return ligne;
      }),
    [t.serie, couverts],
  );

  return (
    <div className="space-y-4">
      <StatsChartCard title="Activité quotidienne" subtitle={sousTitre} icon={TrendingUp}>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={t.serie} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid {...GRID_STYLE} />
              <XAxis dataKey="jour" tickFormatter={court} minTickGap={16} {...AXIS_STYLE} />
              <YAxis allowDecimals={false} {...AXIS_STYLE} />
              <Tooltip content={<ChartTooltip labelFormatter={court} />} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              {series.map((s) => (
                <Line key={s.cle} type="monotone" dataKey={s.cle} name={s.nom} stroke={s.couleur} strokeWidth={2} dot={false} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </StatsChartCard>

      {parPublic && (
        <div className="grid gap-4 xl:grid-cols-2">
          <StatsChartCard title="Entrées par public" subtitle="Contacts entrés au CRM, jour par jour" icon={BarChart3}>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={aplat} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid {...GRID_STYLE} />
                  <XAxis dataKey="jour" tickFormatter={court} minTickGap={16} {...AXIS_STYLE} />
                  <YAxis allowDecimals={false} {...AXIS_STYLE} />
                  <Tooltip content={<ChartTooltip labelFormatter={court} />} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  {couverts.map((p) => (
                    <Bar key={p} dataKey={`e_${p}`} name={PUBLIC_META[p].court} stackId="entrees" fill={COULEUR_PUBLIC[p]} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </StatsChartCard>
          <StatsChartCard title="Ventes par public" subtitle="Ventes du CRM, jour par jour" icon={TrendingUp}>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={aplat} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid {...GRID_STYLE} />
                  <XAxis dataKey="jour" tickFormatter={court} minTickGap={16} {...AXIS_STYLE} />
                  <YAxis allowDecimals={false} {...AXIS_STYLE} />
                  <Tooltip content={<ChartTooltip labelFormatter={court} />} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  {couverts.map((p) => (
                    <Line
                      key={p}
                      type="monotone"
                      dataKey={`v_${p}`}
                      name={PUBLIC_META[p].court}
                      stroke={COULEUR_PUBLIC[p]}
                      strokeWidth={2}
                      dot={false}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </StatsChartCard>
        </div>
      )}
    </div>
  );
}
