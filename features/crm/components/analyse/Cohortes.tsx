import React from "react";
import { CalendarRange } from "lucide-react";
import StatsChartCard from "@/components/gestion/Statistiques/shared/StatsChartCard";
import { useCohortesQuery } from "../../queries/analyse.query";
import { fmtNombre, fmtPct } from "../../utils/crm-ui";
import { EtatRequete } from "../commun/Etats";

const MOIS = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];
const libelleMois = (m: string) => `${MOIS[Number(m.slice(5, 7)) - 1]} ${m.slice(0, 4)}`;

/** Intensité de fond selon le taux : la cohorte qui convertit le mieux saute aux yeux. */
const fond = (taux: number, max: number) => `rgba(22, 163, 74, ${max > 0 ? 0.08 + (taux / max) * 0.35 : 0})`;

/**
 * Cohortes par mois d'inscription (cahier §7), sur tous les clients depuis
 * l'ouverture : la conversion d'un mois continue de monter tant que ses
 * inscrits finissent par commander.
 */
export function Cohortes() {
  const requete = useCohortesQuery();
  const data = requete.data ?? [];
  const max = Math.max(0, ...data.map((c) => c.taux));

  return (
    <StatsChartCard title="Cohortes par mois d'inscription" subtitle="Tous les clients depuis l'ouverture" icon={CalendarRange}>
      <EtatRequete requete={requete}>
        <div className="overflow-x-auto -mx-5 max-h-96">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-white">
              <tr className="text-gray-500 text-xs uppercase">
                {["Mois", "Inscrits", "Ont commandé", "Taux", "Sous 7 jours", "Délai moyen", "Délai médian"].map((c, i) => (
                  <th key={c} className={`font-semibold px-5 py-2 whitespace-nowrap ${i === 0 ? "text-left" : "text-right"}`}>
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...data].reverse().map((c) => (
                <tr key={c.mois} className="border-t border-gray-100">
                  <td className="px-5 py-2 font-semibold text-gray-800 whitespace-nowrap">{libelleMois(c.mois)}</td>
                  <td className="px-5 py-2 text-right tabular-nums">{fmtNombre(c.inscrits)}</td>
                  <td className="px-5 py-2 text-right tabular-nums">{fmtNombre(c.convertis)}</td>
                  <td className="px-5 py-2 text-right tabular-nums font-semibold" style={{ backgroundColor: fond(c.taux, max) }}>
                    {fmtPct(c.taux)}
                  </td>
                  <td className="px-5 py-2 text-right tabular-nums">{fmtPct(c.taux_7_jours)}</td>
                  <td className="px-5 py-2 text-right tabular-nums">{String(c.delai_moyen).replace(".", ",")} j</td>
                  <td className="px-5 py-2 text-right tabular-nums">{String(c.delai_median).replace(".", ",")} j</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </EtatRequete>
    </StatsChartCard>
  );
}
