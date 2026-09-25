import React from "react";
import { Headset } from "lucide-react";
import StatsChartCard from "@/components/gestion/Statistiques/shared/StatsChartCard";
import { IAgentPerf } from "../../types/analyse.type";
import { Public } from "../../types/contact.type";
import { PUBLIC_META, accord, fmtMontant, fmtNombre, fmtPct, publicsCouverts } from "../../utils/crm-ui";
import { Puce } from "../commun/Puces";

/**
 * Performance des agents sur la période. Une vente « travaillée » : l'agent
 * a appelé le client ou lui a envoyé un coupon dans ce passage, avant la
 * commande. Les autres ventes de son portefeuille sont « spontanées » et
 * n'entrent pas dans son taux.
 */
export function AgentsPerf({ agents, publics, parPublic }: { agents: IAgentPerf[]; publics?: Public[]; parPublic?: boolean }) {
  const couverts = publicsCouverts(publics);
  const colonnes = ["Agent", "Portefeuille", "Appels", "Traités", "Joints", "Coupons", "Ventes", "Taux", "Chiffre d'affaires"];
  if (parPublic) colonnes.push("Ventes par public");

  return (
    <StatsChartCard title="Agents" subtitle="Activité sur la période. Taux : ventes travaillées sur contacts traités" icon={Headset}>
      {agents.length === 0 ? (
        <p className="text-sm text-gray-400 py-6 text-center">Aucune activité d&apos;agent sur la période.</p>
      ) : (
        <div className="overflow-x-auto -mx-5">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-500 text-xs uppercase">
                {colonnes.map((c, i) => (
                  <th key={c} className={`font-semibold px-4 py-2 whitespace-nowrap ${i === 0 || i === 9 ? "text-left" : "text-right"}`}>
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {agents.map((a) => (
                <tr key={a.id} className="border-t border-gray-100">
                  <td className="px-4 py-2.5 font-semibold text-gray-800 whitespace-nowrap">{a.fullname}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{fmtNombre(a.portefeuille)}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{fmtNombre(a.appels)}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{fmtNombre(a.traites)}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums whitespace-nowrap">
                    {fmtNombre(a.joints)} <span className="text-xs text-gray-400">({fmtPct(a.taux_contact)})</span>
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{fmtNombre(a.coupons)}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums whitespace-nowrap">
                    <span className="font-semibold text-emerald-700">{fmtNombre(a.ventes)}</span>
                    {a.ventes_spontanees > 0 && (
                      <span className="block text-[11px] text-gray-400">
                        dont {fmtNombre(a.ventes_spontanees)} {accord(a.ventes_spontanees, "spontanée")}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums font-semibold text-emerald-700">{fmtPct(a.taux_conversion)}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums whitespace-nowrap">
                    {fmtMontant(a.ca)}
                    {a.ca_travaille !== a.ca && <span className="block text-[11px] text-gray-400">dont {fmtMontant(a.ca_travaille)} sur ventes travaillées</span>}
                  </td>
                  {parPublic && (
                    <td className="px-4 py-2.5">
                      <div className="flex flex-wrap gap-1 min-w-[160px]">
                        {couverts
                          .filter((p) => (a.par_public?.[p] ?? 0) > 0)
                          .map((p) => (
                            <Puce key={p} label={`${PUBLIC_META[p].court} ${fmtNombre(a.par_public[p])}`} className={PUBLIC_META[p].className} />
                          ))}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </StatsChartCard>
  );
}
