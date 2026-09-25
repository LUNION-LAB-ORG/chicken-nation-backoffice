import React, { useState } from "react";
import { BarChart3, FileSpreadsheet } from "lucide-react";
import { toast } from "react-hot-toast";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import StatsChartCard from "@/components/gestion/Statistiques/shared/StatsChartCard";
import ChartTooltip from "@/components/gestion/Statistiques/shared/ChartTooltip";
import { AXIS_STYLE, CHART_COLORS, GRID_STYLE } from "../../../statistics/utils/chart-config";
import { campagneAPI } from "../../apis/campagne.api";
import { useComparatifQuery } from "../../queries/campagne.query";
import { IComparatifLigne, IIndicateursCampagne } from "../../types/campagne.type";
import { Public } from "../../types/contact.type";
import { PUBLICS, PUBLIC_META, TOUS_META, fmtDate, fmtMontant, fmtNombre, fmtPct } from "../../utils/crm-ui";
import { Bouton } from "../commun/Champs";
import { Chargement, Erreur, Vide } from "../commun/Etats";
import { PuceCampagne, PucePublic } from "../commun/Puces";
import { ONGLET_PUBLIC } from "./etat-campagne";

/** Nom abrégé sous l'axe : le nom complet reste dans l'info-bulle et le tableau. */
const abreger = (nom: string, max = 14) => (nom.length > max ? `${nom.slice(0, max - 1).trimEnd()}…` : nom);

const chronologique = (a: IComparatifLigne, b: IComparatifLigne) =>
  (a.started_at ?? "9999").localeCompare(b.started_at ?? "9999");

const cellule = "px-4 py-3 text-right tabular-nums whitespace-nowrap";

/** Choix d'un public pour le comparatif : un seul à la fois, comme le serveur. */
function ChoixPublicComparatif({ valeur, onChange }: { valeur?: Public; onChange: (p?: Public) => void }) {
  const classe = (actif: boolean) =>
    `text-[13px] font-semibold px-3 py-1 rounded-lg whitespace-nowrap ${
      actif ? "bg-white text-[#F17922] shadow-sm" : "text-[#71717A] hover:text-gray-700"
    }`;
  return (
    <div className="flex flex-wrap items-center gap-1 bg-[#f4f4f5] rounded-xl p-1" role="group" aria-label="Public comparé">
      <button type="button" onClick={() => onChange(undefined)} className={classe(!valeur)} aria-pressed={!valeur}>
        Tous les publics
      </button>
      {PUBLICS.map((p) => (
        <button key={p} type="button" onClick={() => onChange(p)} className={classe(valeur === p)} aria-pressed={valeur === p}>
          {ONGLET_PUBLIC[p]}
        </button>
      ))}
    </div>
  );
}

/**
 * Historique et benchmark des campagnes lancées (cahier §6.3 et §7), dans
 * l'ordre chronologique. Avec un public choisi, chaque ligne montre les
 * chiffres de ce public seul, face à ses objectifs.
 */
export function Comparatif({ peutExporter = false }: { peutExporter?: boolean }) {
  const [segment, setSegment] = useState<Public | undefined>(undefined);
  const [export_, setExport] = useState(false);
  const { data = [], isPending, isError, error, isFetching } = useComparatifQuery(true, segment);

  const mots = segment ? PUBLIC_META[segment] : TOUS_META;
  const lignes = [...data].sort(chronologique);
  const indicateurs = (c: IComparatifLigne): IIndicateursCampagne | null =>
    segment ? (c.public ?? c.par_public?.find((p) => p.segment === segment) ?? null) : c.indicateurs;

  const exporter = () => {
    setExport(true);
    campagneAPI
      .exporterComparatif(segment)
      .catch((e: Error) => toast.error(e.message))
      .finally(() => setExport(false));
  };

  const entete = (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <ChoixPublicComparatif valeur={segment} onChange={setSegment} />
      {peutExporter && (
        <Bouton onClick={exporter} desactive={export_ || isPending || lignes.length === 0}>
          <FileSpreadsheet className="w-4 h-4" /> {export_ ? "Export…" : "Exporter en Excel"}
        </Bouton>
      )}
    </div>
  );

  if (isError) {
    return (
      <div className="space-y-4">
        {entete}
        <Erreur message={(error as Error)?.message} />
      </div>
    );
  }
  if (isPending) {
    return (
      <div className="space-y-4">
        {entete}
        <Chargement />
      </div>
    );
  }
  if (lignes.length === 0) {
    return (
      <div className="space-y-4">
        {entete}
        <Vide
          titre={segment ? `Aucune campagne lancée pour le public « ${PUBLIC_META[segment].label} »` : "Aucune campagne lancée"}
          texte="Le comparatif apparaît après le premier lancement."
        />
      </div>
    );
  }

  const noms = new Map(lignes.map((c) => [c.id, c.name]));
  const graphe = lignes.map((c) => {
    const i = indicateurs(c);
    return { id: c.id, conversion: i?.taux_conversion ?? null, couverture: i?.couverture ?? null };
  });
  const colonnes = ["Campagne", "Publics", "Ciblés", "Couverture", "Taux de contact", "Joints", "Coupons utilisés / envoyés", mots.conversion, "CA", "Durée"];

  return (
    <div className={`space-y-4 ${isFetching ? "opacity-70 transition-opacity" : ""}`}>
      {entete}

      <StatsChartCard
        title={`${mots.taux} et couverture par campagne`}
        subtitle={segment ? `Chiffres du public « ${PUBLIC_META[segment].label} » seul` : "Dans l'ordre des lancements"}
        icon={BarChart3}
      >
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={graphe} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid {...GRID_STYLE} />
              <XAxis dataKey="id" tickFormatter={(id: string) => abreger(noms.get(id) ?? "")} {...AXIS_STYLE} />
              <YAxis unit=" %" {...AXIS_STYLE} />
              <Tooltip
                content={<ChartTooltip labelFormatter={(id) => noms.get(id) ?? ""} valueFormatter={(v) => fmtPct(v)} />}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="couverture" name="Couverture" fill={CHART_COLORS.blue} radius={[4, 4, 0, 0]} />
              <Bar dataKey="conversion" name={mots.taux} fill={CHART_COLORS.success} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </StatsChartCard>

      <div className="bg-white border border-gray-200 rounded-xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-gray-500 text-xs uppercase">
              {colonnes.map((c, i) => (
                <th key={c} className={`font-semibold px-4 py-3 whitespace-nowrap ${i <= 1 ? "text-left" : "text-right"}`}>
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {lignes.map((c) => {
              const i = indicateurs(c);
              return (
                <tr key={c.id} className="border-t border-gray-100 align-top">
                  <td className="px-4 py-3 min-w-[180px]">
                    <p className="font-semibold text-gray-800">{c.name}</p>
                    <p className="text-xs text-gray-500 flex items-center gap-2">
                      {fmtDate(c.started_at)} <PuceCampagne statut={c.status} />
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {PUBLICS.filter((p) => (c.segments ?? []).includes(p)).map((p) => (
                        <PucePublic key={p} segment={p} />
                      ))}
                    </div>
                  </td>
                  <td className={cellule}>{fmtNombre(i?.cibles)}</td>
                  <td className={cellule}>{fmtPct(i?.couverture)}</td>
                  <td className={cellule}>{fmtPct(i?.taux_contact)}</td>
                  <td className={cellule}>
                    {fmtNombre(i?.joints)}
                    {i?.objectif_contacts != null && (
                      <span className="block text-xs text-gray-400">
                        objectif {fmtNombre(i.objectif_contacts)} à joindre
                        {i.progression_objectif_contacts != null && ` (${fmtPct(i.progression_objectif_contacts)})`}
                      </span>
                    )}
                  </td>
                  <td className={cellule}>{i ? `${fmtNombre(i.coupons_utilises)} / ${fmtNombre(i.coupons_envoyes)}` : ""}</td>
                  <td className={`${cellule} font-semibold text-emerald-700`}>
                    {fmtNombre(i?.conversions)} {i && <span className="text-xs text-gray-400 font-normal">({fmtPct(i.taux_conversion)})</span>}
                    {i?.objectif_taux_conversion != null && (
                      <span
                        className={`block text-xs font-normal ${i.taux_conversion < i.objectif_taux_conversion ? "text-rose-600" : "text-gray-400"}`}
                      >
                        objectif {fmtPct(i.objectif_taux_conversion)}
                      </span>
                    )}
                  </td>
                  <td className={cellule}>{fmtMontant(i?.ca_conversions)}</td>
                  <td className={cellule}>
                    {String(c.duree.reelle_jours).replace(".", ",")} j{c.duree.planifiee_jours ? ` / ${c.duree.planifiee_jours}` : ""}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
