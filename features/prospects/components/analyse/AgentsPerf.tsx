import React from "react";
import { Headset } from "lucide-react";
import StatsChartCard from "@/components/gestion/Statistiques/shared/StatsChartCard";
import { IAgentPerf } from "../../types/analyse.type";
import { fmtMontant, fmtNombre, fmtPct } from "../../utils/prospect-ui";

const COLONNES = ["Agent", "Portefeuille", "Appels", "Traités", "Joints", "Coupons", "Conversions", "CA"];

/** Performance des agents sur la période, toutes campagnes confondues. */
export function AgentsPerf({ agents }: { agents: IAgentPerf[] }) {
  return (
    <StatsChartCard title="Agents" subtitle="Activité sur la période" icon={Headset}>
      {agents.length === 0 ? (
        <p className="text-sm text-gray-400 py-6 text-center">Aucune activité d&apos;agent sur la période.</p>
      ) : (
        <div className="overflow-x-auto -mx-5">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-500 text-xs uppercase">
                {COLONNES.map((c, i) => (
                  <th key={c} className={`font-semibold px-5 py-2 whitespace-nowrap ${i === 0 ? "text-left" : "text-right"}`}>
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {agents.map((a) => (
                <tr key={a.id} className="border-t border-gray-100">
                  <td className="px-5 py-2.5 font-semibold text-gray-800 whitespace-nowrap">{a.fullname}</td>
                  <td className="px-5 py-2.5 text-right tabular-nums">{fmtNombre(a.portefeuille)}</td>
                  <td className="px-5 py-2.5 text-right tabular-nums">{fmtNombre(a.appels)}</td>
                  <td className="px-5 py-2.5 text-right tabular-nums">{fmtNombre(a.traites)}</td>
                  <td className="px-5 py-2.5 text-right tabular-nums">
                    {fmtNombre(a.joints)} <span className="text-xs text-gray-400">({fmtPct(a.taux_contact)})</span>
                  </td>
                  <td className="px-5 py-2.5 text-right tabular-nums">{fmtNombre(a.coupons)}</td>
                  <td className="px-5 py-2.5 text-right tabular-nums font-semibold text-emerald-700">
                    {fmtNombre(a.conversions)} <span className="text-xs text-gray-400">({fmtPct(a.taux_conversion)})</span>
                  </td>
                  <td className="px-5 py-2.5 text-right tabular-nums">{fmtMontant(a.ca)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </StatsChartCard>
  );
}
