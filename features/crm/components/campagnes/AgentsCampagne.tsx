import React from "react";
import { Trophy } from "lucide-react";
import StatsChartCard from "@/components/gestion/Statistiques/shared/StatsChartCard";
import { IAgentCampagne } from "../../types/campagne.type";
import { fmtMontant, fmtNombre, fmtPct } from "../../utils/crm-ui";

const COLONNES = ["Agent", "Confiés", "Traités", "Joints", "Coupons", "Conversions", "Taux", "CA"];

/** Performance comparée par agent (cahier §6.3). */
export function AgentsCampagne({ agents }: { agents: IAgentCampagne[] }) {
  return (
    <StatsChartCard title="Performance par agent" subtitle="Classée par conversions" icon={Trophy}>
      {agents.length === 0 ? (
        <p className="text-sm text-gray-400 py-6 text-center">Aucun agent n&apos;a encore travaillé sur cette campagne.</p>
      ) : (
        <div className="overflow-x-auto -mx-5">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-500 text-xs uppercase">
                {COLONNES.map((c, i) => (
                  <th key={c} className={`font-semibold px-5 py-2 ${i === 0 ? "text-left" : "text-right"}`}>
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {agents.map((a, rang) => (
                <tr key={a.id} className="border-t border-gray-100">
                  <td className="px-5 py-2.5 font-semibold text-gray-800">
                    <span className="text-xs text-gray-400 mr-2 tabular-nums">{rang + 1}</span>
                    {a.fullname}
                  </td>
                  <td className="px-5 py-2.5 text-right tabular-nums">{fmtNombre(a.assignes)}</td>
                  <td className="px-5 py-2.5 text-right tabular-nums">{fmtNombre(a.traites)}</td>
                  <td className="px-5 py-2.5 text-right tabular-nums">
                    {fmtNombre(a.joints)} <span className="text-xs text-gray-400">({fmtPct(a.taux_contact)})</span>
                  </td>
                  <td className="px-5 py-2.5 text-right tabular-nums">{fmtNombre(a.coupons)}</td>
                  <td className="px-5 py-2.5 text-right tabular-nums font-semibold text-emerald-700">{fmtNombre(a.conversions)}</td>
                  <td className="px-5 py-2.5 text-right tabular-nums">{fmtPct(a.taux_conversion)}</td>
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
