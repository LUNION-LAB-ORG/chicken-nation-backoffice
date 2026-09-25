import React from "react";
import { Layers } from "lucide-react";
import StatsChartCard from "@/components/gestion/Statistiques/shared/StatsChartCard";
import { ICampagneStats } from "../../types/campagne.type";
import { PUBLICS, PUBLIC_META, accord, estCapte, fmtMontant, fmtNombre, fmtPct } from "../../utils/crm-ui";
import { PucePublic } from "../commun/Puces";

const cellule = "px-4 py-2.5 text-right tabular-nums whitespace-nowrap align-top";
const sous = "block text-xs text-gray-400 font-normal";

/**
 * Indicateurs de chaque public d'une campagne (lot 3), face aux objectifs
 * du public : ventilés par public au ciblage, jamais par public actuel.
 */
export function PublicsCampagne({ s }: { s: ICampagneStats }) {
  const lignes = [...(s.par_public ?? [])].sort((a, b) => PUBLICS.indexOf(a.segment) - PUBLICS.indexOf(b.segment));
  const avecCaptes = lignes.some((l) => estCapte(l.segment));
  const colonnes = ["Public", "Ciblés", "Traités", "Joints", "Coupons", "Ventes", "CA", ...(avecCaptes ? ["Inscrits sur l'appli"] : [])];

  return (
    <StatsChartCard title="Par public" subtitle="Public du contact au lancement, face aux objectifs du public" icon={Layers}>
      <div className="overflow-x-auto -mx-5">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-gray-500 text-xs uppercase">
              {colonnes.map((c, i) => (
                <th key={c} className={`font-semibold px-4 py-2 whitespace-nowrap ${i === 0 ? "text-left" : "text-right"}`}>
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {lignes.map((l) => {
              const meta = PUBLIC_META[l.segment];
              const pub = (s.campagne.publics ?? []).find((p) => p.segment === l.segment);
              const objectifTaux = l.objectif_taux_conversion;
              const sousObjectif = objectifTaux != null && l.taux_conversion < objectifTaux;
              return (
                <tr key={l.segment} className="border-t border-gray-100">
                  <td className="px-4 py-2.5 align-top min-w-[220px]">
                    <PucePublic segment={l.segment} />
                    {pub?.criteres && <span className="block text-xs text-gray-500 mt-1">{pub.criteres}</span>}
                    {pub?.offer && <span className="block text-xs text-gray-500">Offre : {pub.offer.label}</span>}
                  </td>
                  <td className={cellule}>
                    {fmtNombre(l.cibles)}
                    {l.restants > 0 && <span className={sous}>{fmtNombre(l.restants)} {accord(l.restants, "jamais appelé")}</span>}
                  </td>
                  <td className={cellule}>
                    {fmtNombre(l.traites)}
                    <span className={sous}>couverture {fmtPct(l.couverture)}</span>
                  </td>
                  <td className={cellule}>
                    {fmtNombre(l.joints)}
                    <span className={sous}>
                      {l.objectif_contacts != null
                        ? `objectif ${fmtNombre(l.objectif_contacts)} à joindre${
                            l.progression_objectif_contacts != null ? ` (${fmtPct(l.progression_objectif_contacts)})` : ""
                          }`
                        : `contact ${fmtPct(l.taux_contact)}`}
                    </span>
                  </td>
                  <td className={cellule}>
                    {fmtNombre(l.coupons_utilises)} / {fmtNombre(l.coupons_envoyes)}
                    {l.ca_coupons > 0 && <span className={sous}>{fmtMontant(l.ca_coupons)} de commandes</span>}
                  </td>
                  <td className={cellule}>
                    <span className="font-semibold text-emerald-700">{fmtNombre(l.conversions)}</span>
                    <span className={`block text-xs font-normal ${sousObjectif ? "text-rose-600" : "text-gray-400"}`}>
                      {meta.taux.toLowerCase()} {fmtPct(l.taux_conversion)}
                      {objectifTaux != null && ` · objectif ${fmtPct(objectifTaux)}`}
                    </span>
                  </td>
                  <td className={cellule}>
                    {fmtMontant(l.ca_conversions)}
                    {l.conversions > 0 && <span className={sous}>panier {fmtMontant(l.panier_moyen)}</span>}
                  </td>
                  {avecCaptes && (
                    <td className={cellule} title="Ciblés inscrits sur l'appli entre le lancement et la clôture">
                      {estCapte(l.segment) ? fmtNombre(l.inscrits_appli_pendant) : ""}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </StatsChartCard>
  );
}
