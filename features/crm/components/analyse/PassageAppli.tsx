import React from "react";
import { Smartphone } from "lucide-react";
import StatsChartCard from "@/components/gestion/Statistiques/shared/StatsChartCard";
import { IPassageAppli } from "../../types/analyse.type";
import { PUBLIC_META, compter, fmtNombre, fmtPct } from "../../utils/crm-ui";

const part = (n: number, sur: number) => (sur > 0 ? fmtPct(Math.round((n / sur) * 1000) / 10) : "");

function Ligne({ label, aide, nombre, sur, accent }: { label: string; aide?: string; nombre: number; sur?: number; accent?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-2 border-t border-gray-100 first:border-t-0">
      <div className="min-w-0">
        <p className={`text-sm ${accent ? "font-semibold text-gray-900" : "text-gray-700"}`}>{label}</p>
        {aide && <p className="text-xs text-gray-400">{aide}</p>}
      </div>
      <p className="text-sm tabular-nums whitespace-nowrap">
        <span className={accent ? "font-bold text-emerald-700" : "font-semibold text-gray-800"}>{fmtNombre(nombre)}</span>
        {sur != null && <span className="text-xs text-gray-400"> · {part(nombre, sur)}</span>}
      </p>
    </div>
  );
}

/**
 * Glovo/Yango : ce que deviennent les clients captés sur la période face à
 * l'appli. Les déjà-clients de l'appli sont comptés à part, hors taux.
 */
export function PassageAppli({ p }: { p: IPassageAppli }) {
  const plateformes = p.publics.map((s) => PUBLIC_META[s].court).join(" et ");
  return (
    <StatsChartCard title="Passage sur l'appli" subtitle={`Clients ${plateformes} captés sur la période`} icon={Smartphone}>
      <div>
        <Ligne label="Captés" nombre={p.captes} />
        <Ligne label="Déjà inscrits à la capture" aide="compte appli créé avant la capture" nombre={p.deja_inscrits_a_la_capture} sur={p.captes} />
        <Ligne label="Inscrits depuis la capture" nombre={p.inscrits_apres_capture} sur={p.captes} />
        <Ligne label="Toujours sans compte" nombre={p.sans_compte} sur={p.captes} />
        <Ligne
          label="Commandes directes"
          aide={`taux de passage en direct ${fmtPct(p.taux_passage_direct)}, hors déjà clients`}
          nombre={p.commandes_directes}
          accent
        />
        <Ligne
          label="Déjà clients de l'appli"
          aide={`comptés à part : ${compter(p.ventes_deja_clients, "vente")}, hors taux`}
          nombre={p.deja_clients}
          sur={p.captes}
        />
      </div>
    </StatsChartCard>
  );
}
