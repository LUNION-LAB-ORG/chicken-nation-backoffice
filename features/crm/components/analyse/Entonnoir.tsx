import React from "react";
import { Filter } from "lucide-react";
import StatsChartCard from "@/components/gestion/Statistiques/shared/StatsChartCard";
import { IVueEnsemble } from "../../types/analyse.type";
import { Public } from "../../types/contact.type";
import { compter, fmtNombre, fmtPct, vocabulaire } from "../../utils/crm-ui";

const TEINTES = ["#FDBA74", "#FB923C", "#F97316", "#EA580C", "#C2410C"];
const VERT = "#16A34A";
/** Orange qui fonce étape après étape (la dernière teinte sert de repli) ; le vert est réservé aux commandes. */
export const teinteEtape = (cle: string, i: number) => (cle === "commandes" ? VERT : TEINTES[i] ?? TEINTES[TEINTES.length - 1]);

/**
 * Entonnoir emboîté d'un public (ou de Glovo + Yango) : passages entrés sur
 * la période, puis contactés, joints, intéressés, coupon envoyé et commande.
 * Chaque étape exige la précédente, dans le même passage. Les ventes qui
 * n'ont pas franchi « Coupon envoyé » sont comptées sous l'entonnoir.
 */
export function Entonnoir({
  etapes,
  hors,
  publics,
}: {
  etapes: IVueEnsemble["entonnoir"];
  hors?: IVueEnsemble["hors_entonnoir"];
  publics?: Public[];
}) {
  const base = Math.max(1, etapes[0]?.nombre ?? 1);
  // « Entonnoir de conversion », « de reconquête » ou « de passage en direct », selon le public.
  const titre = vocabulaire(publics).taux.replace(/^Taux/, "Entonnoir");
  return (
    <StatsChartCard title={titre} subtitle="Contacts entrés sur la période, étape par étape" icon={Filter}>
      <ol className="space-y-2">
        {etapes.map((e, i) => (
          <li key={e.cle} className="grid grid-cols-[110px_1fr_auto] sm:grid-cols-[140px_1fr_auto] items-center gap-3 text-sm">
            <span className="text-gray-700 font-medium">{e.libelle}</span>
            <div className="h-7 bg-gray-50 rounded-lg overflow-hidden" title={`${fmtPct(e.part_entree)} des entrés`}>
              <div
                className="h-full rounded-lg flex items-center px-2 text-xs font-semibold text-white tabular-nums"
                style={{ width: `${Math.max(4, (e.nombre / base) * 100)}%`, backgroundColor: teinteEtape(e.cle, i) }}
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
      {hors && (hors.commandes > 0 || hors.repris > 0) && (
        <div className="mt-4 border-t border-gray-100 pt-3 space-y-1 text-xs text-gray-600">
          {hors.commandes > 0 && (
            <p>
              Hors entonnoir : <strong>{compter(hors.commandes, "vente")}</strong> sans coupon envoyé à un contact joint
              {hors.sans_contact > 0 && `, dont ${hors.sans_contact} sans aucun contact préalable`}.
            </p>
          )}
          {hors.repris > 0 && (
            <p className="text-gray-500">
              {compter(hors.repris, "client repris", "clients repris")} avec une commande antérieure à leur entrée : hors ventes
              et hors taux.
            </p>
          )}
        </div>
      )}
    </StatsChartCard>
  );
}
