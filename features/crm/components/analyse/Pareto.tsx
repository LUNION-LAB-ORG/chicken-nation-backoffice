import React, { useMemo } from "react";
import { MessageSquareWarning } from "lucide-react";
import { Bar, CartesianGrid, Cell, ComposedChart, Legend, Line, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import StatsChartCard from "@/components/gestion/Statistiques/shared/StatsChartCard";
import ChartTooltip from "@/components/gestion/Statistiques/shared/ChartTooltip";
import { AXIS_STYLE, CHART_COLORS, GRID_STYLE } from "../../../statistics/utils/chart-config";
import { IPareto } from "../../types/analyse.type";
import { Public } from "../../types/contact.type";
import { COULEUR_PUBLIC, PUBLIC_META, accord, compter, fmtPct, publicsCouverts } from "../../utils/crm-ui";

const court = (t: string) => (t.length > 16 ? `${t.slice(0, 15)}…` : t);
const NON_RENSEIGNEE = "Raison non renseignée";
/** Clé d'une raison : `id` null = refus sans raison saisie. */
const cle = (id: string | null) => id ?? "aucune";

/**
 * Pareto des raisons de non-achat : les barres pleines sont les quelques
 * blocages qui expliquent 80 % des refus, ceux à traiter en premier. Avec
 * plusieurs publics, chaque barre se découpe par public.
 */
export function Pareto({ pareto, publics, parPublic }: { pareto: IPareto; publics?: Public[]; parPublic?: boolean }) {
  const principales = pareto.raisons.filter((r) => r.principale).map((r) => r.raison || NON_RENSEIGNEE);
  const couverts = publicsCouverts(publics);

  // Une ligne par raison, avec une colonne par public pour les barres empilées.
  const donnees = useMemo(
    () =>
      pareto.raisons.map((r) => {
        const ligne: Record<string, string | number | boolean> = {
          raison: r.raison || NON_RENSEIGNEE,
          nombre: r.nombre,
          cumul: r.cumul,
          principale: r.principale,
        };
        (pareto.par_public ?? [])
          .filter((x) => cle(x.id) === cle(r.id))
          .forEach((x) => {
            ligne[`p_${x.segment}`] = ((ligne[`p_${x.segment}`] as number) ?? 0) + x.nombre;
          });
        return ligne;
      }),
    [pareto],
  );

  const n = principales.length;
  return (
    <StatsChartCard
      title="Pourquoi ils ne commandent pas"
      subtitle={
        pareto.total === 0
          ? "Aucun refus sur la période"
          : `${compter(pareto.total, "refus", "refus")} · ${compter(n, "raison")} ${accord(n, "fait", "font")} 80 %`
      }
      icon={MessageSquareWarning}
    >
      {pareto.total === 0 ? (
        <p className="text-sm text-gray-400 py-10 text-center">Les raisons saisies par les agents apparaîtront ici.</p>
      ) : (
        <>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={donnees} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid {...GRID_STYLE} />
                <XAxis dataKey="raison" tickFormatter={court} interval={0} {...AXIS_STYLE} />
                <YAxis yAxisId="n" allowDecimals={false} {...AXIS_STYLE} />
                <YAxis yAxisId="p" orientation="right" domain={[0, 100]} unit=" %" {...AXIS_STYLE} />
                <Tooltip content={<ChartTooltip valueFormatter={(v, nom) => (nom === "Cumul" ? fmtPct(v) : String(v))} />} />
                <ReferenceLine yAxisId="p" y={80} stroke={CHART_COLORS.textMuted} strokeDasharray="4 4" />
                {parPublic ? (
                  couverts.map((p) => (
                    <Bar key={p} yAxisId="n" dataKey={`p_${p}`} name={PUBLIC_META[p].court} stackId="raisons" fill={COULEUR_PUBLIC[p]}>
                      {donnees.map((d, i) => (
                        <Cell key={i} fill={COULEUR_PUBLIC[p]} fillOpacity={d.principale ? 1 : 0.4} />
                      ))}
                    </Bar>
                  ))
                ) : (
                  <Bar yAxisId="n" dataKey="nombre" name="Contacts" radius={[4, 4, 0, 0]}>
                    {donnees.map((d, i) => (
                      <Cell key={i} fill={CHART_COLORS.primary} fillOpacity={d.principale ? 1 : 0.35} />
                    ))}
                  </Bar>
                )}
                <Line yAxisId="p" dataKey="cumul" name="Cumul" stroke={CHART_COLORS.blue} strokeWidth={2} dot={{ r: 3 }} />
                {parPublic && <Legend wrapperStyle={{ fontSize: 12 }} />}
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
