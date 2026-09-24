import React from "react";
import { Filter } from "lucide-react";
import StatsChartCard from "@/components/gestion/Statistiques/shared/StatsChartCard";
import { IVueEnsemble } from "../../types/analyse.type";
import { fmtNombre, fmtPct } from "../../utils/crm-ui";

const TEINTES = ["#FDBA74", "#FB923C", "#F97316", "#EA580C", "#C2410C"];
const VERT = "#16A34A";
/** Orange qui fonce étape après étape ; le vert est réservé aux commandes, quel que soit le nombre d'étapes. */
const teinte = (cle: string, i: number) => (cle === "commandes" ? VERT : TEINTES[Math.min(i, TEINTES.length - 1)]);

/**
 * Entonnoir global (cahier §7) : Inscrit, Contacté, Joint, Intéressé, Coupon
 * envoyé, Commande passée. Le pourcentage à droite dit où l'on perd le plus.
 */
export function Entonnoir({ etapes }: { etapes: IVueEnsemble["entonnoir"] }) {
  const base = Math.max(1, etapes[0]?.nombre ?? 1);
  return (
    <StatsChartCard title="Entonnoir de conversion" subtitle="Contacts entrés sur la période, étape par étape" icon={Filter}>
      <ol className="space-y-2">
        {etapes.map((e, i) => (
          <li key={e.cle} className="grid grid-cols-[140px_1fr_auto] items-center gap-3 text-sm">
            <span className="text-gray-700 font-medium">{e.libelle}</span>
            <div className="h-7 bg-gray-50 rounded-lg overflow-hidden">
              <div
                className="h-full rounded-lg flex items-center px-2 text-xs font-semibold text-white tabular-nums"
                style={{ width: `${Math.max(4, (e.nombre / base) * 100)}%`, backgroundColor: teinte(e.cle, i) }}
              >
                {fmtNombre(e.nombre)}
              </div>
            </div>
            <span className="text-xs tabular-nums text-gray-500 w-24 text-right">
              {i === 0 ? "100 %" : `${fmtPct(e.part_etape_precedente)} de l'étape`}
            </span>
          </li>
        ))}
      </ol>
    </StatsChartCard>
  );
}
