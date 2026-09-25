import React from "react";
import { Filter } from "lucide-react";
import StatsChartCard from "@/components/gestion/Statistiques/shared/StatsChartCard";
import { CleEtape, IEntonnoirPublic } from "../../types/analyse.type";
import { Public } from "../../types/contact.type";
import { PUBLIC_META, compter, fmtNombre, fmtPct } from "../../utils/crm-ui";
import { PucePublic } from "../commun/Puces";
import { teinteEtape } from "./Entonnoir";

const ORDRE: CleEtape[] = ["entrees", "contactes", "joints", "interesses", "coupons", "commandes"];

function MiniEntonnoir({ e, onChoisir }: { e: IEntonnoirPublic; onChoisir?: (p: Public) => void }) {
  const base = Math.max(1, e.etapes.find((x) => x.cle === "entrees")?.nombre ?? 1);
  return (
    <div className="border border-gray-100 rounded-xl p-3">
      <div className="flex items-center justify-between gap-2 mb-3">
        <PucePublic segment={e.segment} />
        {onChoisir && (
          <button type="button" onClick={() => onChoisir(e.segment)} className="text-xs font-semibold text-[#F17922] hover:underline">
            Détail
          </button>
        )}
      </div>
      <ol className="space-y-1.5">
        {ORDRE.map((cle, i) => {
          const etape = e.etapes.find((x) => x.cle === cle);
          const nombre = etape?.nombre ?? 0;
          return (
            <li key={cle} className="grid grid-cols-[96px_1fr_auto] items-center gap-2 text-xs">
              <span className="text-gray-600 truncate" title={etape?.libelle}>
                {etape?.libelle ?? ""}
              </span>
              <div className="h-4 bg-gray-50 rounded overflow-hidden">
                <div className="h-full rounded" style={{ width: `${Math.max(3, (nombre / base) * 100)}%`, backgroundColor: teinteEtape(cle, i) }} />
              </div>
              <span className="tabular-nums text-gray-700 font-semibold w-12 text-right">{fmtNombre(nombre)}</span>
            </li>
          );
        })}
      </ol>
      <div className="mt-3 border-t border-gray-100 pt-2 text-xs text-gray-600 space-y-0.5">
        <p>
          {PUBLIC_META[e.segment].taux} : <strong className="text-emerald-700">{fmtPct(e.taux_conversion)}</strong>
        </p>
        {e.hors_entonnoir > 0 && (
          <p className="text-gray-500">
            {compter(e.hors_entonnoir, "vente")} hors entonnoir
            {e.sans_contact > 0 && `, dont ${e.sans_contact} sans aucun contact préalable`}
          </p>
        )}
        {e.repris > 0 && <p className="text-gray-400">{compter(e.repris, "client repris", "clients repris")}, hors taux</p>}
      </div>
    </div>
  );
}

/**
 * Un mini-entonnoir par public, côte à côte et alignés étape par étape :
 * les publics ne se mélangent jamais dans un même entonnoir.
 */
export function EntonnoirsPublics({ entonnoirs, onChoisir }: { entonnoirs: IEntonnoirPublic[]; onChoisir?: (p: Public) => void }) {
  return (
    <StatsChartCard title="Entonnoirs par public" subtitle="Contacts entrés sur la période, chaque étape exige la précédente" icon={Filter}>
      {entonnoirs.length === 0 ? (
        <p className="text-sm text-gray-400 py-6 text-center">Aucun public sur ce filtre.</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-4">
          {entonnoirs.map((e) => (
            <MiniEntonnoir key={e.segment} e={e} onChoisir={onChoisir} />
          ))}
        </div>
      )}
    </StatsChartCard>
  );
}
