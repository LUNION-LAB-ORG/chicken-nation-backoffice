import React from "react";
import { Trophy } from "lucide-react";
import StatsChartCard from "@/components/gestion/Statistiques/shared/StatsChartCard";
import { IAgentCampagne, ICampagneStats } from "../../types/campagne.type";
import { PUBLICS, PUBLIC_META, accord, fmtMontant, fmtNombre, fmtPct } from "../../utils/crm-ui";

const COLONNES = ["Agent", "Confiés", "Traités", "Joints", "Coupons", "Ventes", "Taux", "CA"];

/** Performance comparée par agent (cahier §6.3), avec ses ventes par public quand la campagne en vise plusieurs. */
export function AgentsCampagne({
  agents,
  ventesSansAgent,
  plusieursPublics = false,
}: {
  agents: IAgentCampagne[];
  ventesSansAgent?: ICampagneStats["ventes_sans_agent"];
  plusieursPublics?: boolean;
}) {
  const sansAgent = ventesSansAgent && ventesSansAgent.conversions > 0 ? ventesSansAgent : null;

  return (
    <StatsChartCard title="Performance par agent" subtitle="Classée par ventes" icon={Trophy}>
      {agents.length === 0 ? (
        <p className="text-sm text-gray-400 py-6 text-center">Aucun agent n&apos;a encore travaillé sur cette campagne.</p>
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
              {agents.map((a, rang) => {
                const parPublic = [...(a.par_public ?? [])]
                  .filter((p) => p.conversions > 0 || p.assignes > 0)
                  .sort((x, y) => PUBLICS.indexOf(x.segment) - PUBLICS.indexOf(y.segment));
                return (
                  <tr key={a.id} className="border-t border-gray-100 align-top">
                    <td className="px-5 py-2.5 font-semibold text-gray-800">
                      <span className="whitespace-nowrap">
                        <span className="text-xs text-gray-400 mr-2 tabular-nums">{rang + 1}</span>
                        {a.fullname}
                      </span>
                      {plusieursPublics && parPublic.length > 0 && (
                        <span className="flex flex-wrap gap-1 mt-1 font-normal">
                          {parPublic.map((p) => (
                            <span
                              key={p.segment}
                              title={`${PUBLIC_META[p.segment].label} : ${fmtNombre(p.assignes)} ${accord(p.assignes, "confié")}, ${fmtMontant(p.ca)}`}
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold whitespace-nowrap ${PUBLIC_META[p.segment].className}`}
                            >
                              {PUBLIC_META[p.segment].court} {fmtNombre(p.conversions)} {accord(p.conversions, "vente")}
                            </span>
                          ))}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-2.5 text-right tabular-nums">{fmtNombre(a.assignes)}</td>
                    <td className="px-5 py-2.5 text-right tabular-nums">{fmtNombre(a.traites)}</td>
                    <td className="px-5 py-2.5 text-right tabular-nums whitespace-nowrap">
                      {fmtNombre(a.joints)} <span className="text-xs text-gray-400">({fmtPct(a.taux_contact)})</span>
                    </td>
                    <td className="px-5 py-2.5 text-right tabular-nums">{fmtNombre(a.coupons)}</td>
                    <td className="px-5 py-2.5 text-right tabular-nums font-semibold text-emerald-700">{fmtNombre(a.conversions)}</td>
                    <td className="px-5 py-2.5 text-right tabular-nums">{fmtPct(a.taux_conversion)}</td>
                    <td className="px-5 py-2.5 text-right tabular-nums whitespace-nowrap">{fmtMontant(a.ca)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {sansAgent && (
        <p className="text-xs text-gray-500 mt-3">
          Ventes sans agent : {fmtNombre(sansAgent.conversions)} {accord(sansAgent.conversions, "vente")} pour {fmtMontant(sansAgent.ca)} (contacts
          de la campagne qui ont commandé sans vente attribuée à un agent).
        </p>
      )}
    </StatsChartCard>
  );
}
