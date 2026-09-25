import React from "react";
import { Ticket, Users } from "lucide-react";
import StatsCard from "@/components/gestion/Statistiques/shared/StatsCard";
import StatsChartCard from "@/components/gestion/Statistiques/shared/StatsChartCard";
import { useCouponsStatsQuery } from "../../queries/analyse.query";
import { IPeriode } from "../../types/analyse.type";
import { CanalCoupon } from "../../types/contact.type";
import { CANAL_LABEL, compter, fmtJours, fmtMontant, fmtNombre, fmtPct } from "../../utils/crm-ui";
import { BarresRepartition } from "../commun/BarresRepartition";
import { EtatRequete } from "../commun/Etats";
import { PucePublic } from "../commun/Puces";

const majuscule = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);

const COLONNES = ["Public", "Envoyés", "Utilisés", "Taux", "Sur commande annulée", "Encore valables", "Expirés", "Chiffre d'affaires", "Remises", "Panier moyen"];

/**
 * Coupons envoyés sur la période (date d'envoi) et ce qu'ils ont donné. Un
 * coupon passé sur une commande annulée n'est ni utilisé ni valable : il est
 * compté à part. `onVoir` ouvre la liste des contacts filtrée sur l'état
 * choisi ; `parPublic` ajoute le tableau par public.
 */
export function CouponsResume({
  periode,
  onVoir,
  parPublic,
}: {
  periode: IPeriode;
  onVoir?: (etat: "ACTIF" | "UTILISE" | "EXPIRE") => void;
  parPublic?: boolean;
}) {
  const requete = useCouponsStatsQuery(periode);
  const c = requete.data;
  if (!c) return <EtatRequete requete={requete}>{null}</EtatRequete>;

  const carte = (etat: "ACTIF" | "UTILISE" | "EXPIRE") => (onVoir ? () => onVoir(etat) : undefined);
  const delai =
    c.utilises === 0
      ? "aucun coupon utilisé sur la période"
      : c.delai_median_jours != null
        ? `de l'envoi à la commande, en moyenne ; médian ${fmtJours(c.delai_median_jours)}`
        : "de l'envoi à la commande, en moyenne";

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatsCard title="Coupons envoyés" value={fmtNombre(c.envoyes)} subtitle="sur la période, par date d'envoi" />
        <StatsCard
          title="Utilisés"
          value={fmtNombre(c.utilises)}
          subtitle={`Taux d'utilisation ${fmtPct(c.taux_utilisation)}`}
          color="green"
          onClick={carte("UTILISE")}
        />
        <StatsCard title="Chiffre d'affaires" value={fmtMontant(c.ca)} subtitle={`Panier moyen ${fmtMontant(c.panier_moyen)}`} color="green" />
        <StatsCard title="Remises" value={fmtMontant(c.remises)} subtitle="remise totale des commandes payées par coupon" color="purple" />
        <StatsCard
          title="Délai avant commande"
          value={c.utilises > 0 ? fmtJours(c.delai_moyen_jours) : ""}
          subtitle={delai}
          color="purple"
        />
        <StatsCard title="Encore valables" value={fmtNombre(c.actifs)} subtitle="pas encore utilisés ni expirés" color="blue" onClick={carte("ACTIF")} />
        <StatsCard title="Expirés" value={fmtNombre(c.expires)} subtitle="sans commande" onClick={carte("EXPIRE")} />
        <StatsCard
          title="Sur commande annulée"
          value={fmtNombre(c.sur_commande_annulee)}
          subtitle="ni utilisés, ni valables"
        />
      </div>

      {parPublic && (c.par_public ?? []).length > 0 && (
        <StatsChartCard title="Par public" subtitle={`${compter(c.envoyes, "coupon envoyé", "coupons envoyés")} sur la période`} icon={Users}>
          <div className="overflow-x-auto -mx-5">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-500 text-xs uppercase">
                  {COLONNES.map((col, i) => (
                    <th key={col} className={`font-semibold px-4 py-2 whitespace-nowrap ${i === 0 ? "text-left" : "text-right"}`}>
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {c.par_public.map((p) => (
                  <tr key={p.segment} className="border-t border-gray-100">
                    <td className="px-4 py-2.5 whitespace-nowrap" title={p.libelle}>
                      <PucePublic segment={p.segment} />
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums">{fmtNombre(p.envoyes)}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums font-semibold text-emerald-700">{fmtNombre(p.utilises)}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums">{fmtPct(p.taux_utilisation)}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums">{fmtNombre(p.sur_commande_annulee)}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums">{fmtNombre(p.actifs)}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums">{fmtNombre(p.expires)}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums whitespace-nowrap">{fmtMontant(p.ca)}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums whitespace-nowrap">{fmtMontant(p.remises)}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums whitespace-nowrap">{p.utilises > 0 ? fmtMontant(p.panier_moyen) : ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </StatsChartCard>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <StatsChartCard title="Par offre" subtitle="Envoyés et taux d'utilisation" icon={Ticket}>
          <BarresRepartition
            lignes={c.par_offre.map((o) => ({ label: `${o.offre} (${fmtPct(o.taux)} utilisés)`, nombre: o.envoyes }))}
            vide="Aucun coupon envoyé sur la période."
          />
        </StatsChartCard>
        <StatsChartCard title="Par canal" subtitle="WhatsApp, SMS ou non envoyé" icon={Ticket}>
          <BarresRepartition
            couleur="#3B82F6"
            lignes={c.par_canal.map((x) => ({ label: majuscule(CANAL_LABEL[x.canal as CanalCoupon] ?? x.canal), nombre: x.envoyes }))}
            vide="Aucun coupon envoyé sur la période."
          />
        </StatsChartCard>
      </div>
    </div>
  );
}
