import React from "react";
import { BarChart3 } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import StatsChartCard from "@/components/gestion/Statistiques/shared/StatsChartCard";
import ChartTooltip from "@/components/gestion/Statistiques/shared/ChartTooltip";
import { AXIS_STYLE, CHART_COLORS, GRID_STYLE } from "../../../statistics/utils/chart-config";
import { useComparatifQuery } from "../../queries/campagne.query";
import { fmtDate, fmtMontant, fmtNombre, fmtPct } from "../../utils/prospect-ui";
import { Chargement, Erreur, Vide } from "../commun/Etats";
import { PuceCampagne } from "../commun/Puces";

const COLONNES = ["Campagne", "Ciblés", "Couverture", "Contact", "Coupons utilisés", "Conversions", "CA", "Durée"];

/** Historique et benchmark de toutes les campagnes lancées (cahier §6.3 et §7). */
export function Comparatif() {
  const { data = [], isPending, isError, error } = useComparatifQuery(true);
  if (isError) return <Erreur message={(error as Error)?.message} />;
  if (isPending) return <Chargement />;
  if (data.length === 0) return <Vide titre="Aucune campagne lancée" texte="Le comparatif apparaît après le premier lancement." />;

  const graphe = data.map((c) => ({ nom: c.name, conversion: c.indicateurs.taux_conversion, couverture: c.indicateurs.couverture }));

  return (
    <div className="space-y-4">
      <StatsChartCard title="Conversion et couverture par campagne" icon={BarChart3}>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={graphe} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid {...GRID_STYLE} />
              <XAxis dataKey="nom" {...AXIS_STYLE} />
              <YAxis unit=" %" {...AXIS_STYLE} />
              <Tooltip content={<ChartTooltip valueFormatter={(v) => fmtPct(v)} />} />
              <Bar dataKey="couverture" name="Couverture" fill={CHART_COLORS.blue} radius={[4, 4, 0, 0]} />
              <Bar dataKey="conversion" name="Conversion" fill={CHART_COLORS.success} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </StatsChartCard>

      <div className="bg-white border border-gray-200 rounded-xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-gray-500 text-xs uppercase">
              {COLONNES.map((c, i) => (
                <th key={c} className={`font-semibold px-4 py-3 whitespace-nowrap ${i === 0 ? "text-left" : "text-right"}`}>
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((c) => (
              <tr key={c.id} className="border-t border-gray-100">
                <td className="px-4 py-3">
                  <p className="font-semibold text-gray-800">{c.name}</p>
                  <p className="text-xs text-gray-500 flex items-center gap-2">
                    {fmtDate(c.started_at)} <PuceCampagne statut={c.status} />
                  </p>
                </td>
                <td className="px-4 py-3 text-right tabular-nums">{fmtNombre(c.indicateurs.cibles)}</td>
                <td className="px-4 py-3 text-right tabular-nums">{fmtPct(c.indicateurs.couverture)}</td>
                <td className="px-4 py-3 text-right tabular-nums">{fmtPct(c.indicateurs.taux_contact)}</td>
                <td className="px-4 py-3 text-right tabular-nums">
                  {fmtNombre(c.indicateurs.coupons_utilises)} / {fmtNombre(c.indicateurs.coupons_envoyes)}
                </td>
                <td className="px-4 py-3 text-right tabular-nums font-semibold text-emerald-700">
                  {fmtNombre(c.indicateurs.conversions)} <span className="text-xs text-gray-400">({fmtPct(c.indicateurs.taux_conversion)})</span>
                </td>
                <td className="px-4 py-3 text-right tabular-nums">{fmtMontant(c.indicateurs.ca_conversions)}</td>
                <td className="px-4 py-3 text-right tabular-nums whitespace-nowrap">
                  {String(c.duree.reelle_jours).replace(".", ",")} j{c.duree.planifiee_jours ? ` / ${c.duree.planifiee_jours}` : ""}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
