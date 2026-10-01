import React from "react";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import ChartTooltip from "@/components/gestion/Statistiques/shared/ChartTooltip";
import { AXIS_STYLE, GRID_STYLE } from "../../../../statistics/utils/chart-config";
import { IRapport } from "../../../types/analyse.type";
import { COULEUR_PUBLIC } from "../../../utils/crm-ui";

/** Orange de la charte : la même couleur que les premières commandes dans le PDF. */
const ORANGE = "#F17922";
const court = (date: string) => `${date.slice(8, 10)}/${date.slice(5, 7)}`;

/**
 * Inscrits et premières commandes, jour par jour (par semaine au-delà de
 * 45 jours) : c'est là qu'on voit les pics des lives. Deux séries côte à
 * côte, aux couleurs du public « inscrits » et des ventes.
 */
export function CourbeInscriptions({ serie, pas }: { serie: IRapport["inscriptions"]["serie"]; pas: IRapport["inscriptions"]["pas"] }) {
  const libelle = (date: string) => (pas === "semaine" ? `Semaine du ${court(date)}` : court(date));
  if (serie.length === 0) return <p className="py-6 text-center text-sm text-gray-400">Aucune inscription sur la période.</p>;
  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
        {pas === "semaine" ? "Semaine par semaine" : "Jour par jour"}
      </p>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={serie} margin={{ top: 8, right: 8, left: -16, bottom: 0 }} barCategoryGap="25%">
            <CartesianGrid {...GRID_STYLE} vertical={false} />
            <XAxis dataKey="date" tickFormatter={court} minTickGap={16} {...AXIS_STYLE} />
            <YAxis allowDecimals={false} {...AXIS_STYLE} />
            <Tooltip content={<ChartTooltip labelFormatter={libelle} />} cursor={{ fill: "rgba(14, 165, 233, 0.06)" }} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="inscrits" name="Inscrits" fill={COULEUR_PUBLIC.JAMAIS_COMMANDE} radius={[3, 3, 0, 0]} maxBarSize={28} />
            <Bar dataKey="premieres_commandes" name="Premières commandes" fill={ORANGE} radius={[3, 3, 0, 0]} maxBarSize={28} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
