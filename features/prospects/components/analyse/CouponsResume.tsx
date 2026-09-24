import React from "react";
import { Ticket } from "lucide-react";
import StatsCard from "@/components/gestion/Statistiques/shared/StatsCard";
import StatsChartCard from "@/components/gestion/Statistiques/shared/StatsChartCard";
import { useCouponsStatsQuery } from "../../queries/analyse.query";
import { IPeriode } from "../../types/analyse.type";
import { CanalCoupon } from "../../types/prospect.type";
import { CANAL_LABEL, fmtMontant, fmtNombre, fmtPct } from "../../utils/prospect-ui";
import { BarresRepartition } from "../commun/BarresRepartition";

/**
 * Coupons et mesure de la conversion (cahier §5), par date d'envoi.
 * `onVoir` ouvre la liste des prospects filtrée sur l'état choisi.
 */
export function CouponsResume({ periode, onVoir }: { periode: IPeriode; onVoir?: (etat: "ACTIF" | "UTILISE" | "EXPIRE") => void }) {
  const { data: c } = useCouponsStatsQuery(periode);
  if (!c) return null;

  const carte = (etat: "ACTIF" | "UTILISE" | "EXPIRE") => (onVoir ? () => onVoir(etat) : undefined);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatsCard title="Coupons envoyés" value={fmtNombre(c.envoyes)} subtitle={`${fmtNombre(c.actifs)} encore valables`} onClick={carte("ACTIF")} />
        <StatsCard title="Utilisés" value={fmtNombre(c.utilises)} subtitle={`Taux d'utilisation ${fmtPct(c.taux_utilisation)}`} color="green" onClick={carte("UTILISE")} />
        <StatsCard title="Chiffre d'affaires" value={fmtMontant(c.ca)} subtitle={`Panier moyen ${fmtMontant(c.panier_moyen)}`} color="green" />
        <StatsCard
          title="Délai envoi → commande"
          value={`${String(c.delai_moyen_jours).replace(".", ",")} j`}
          subtitle={`${fmtNombre(c.expires)} expirés sans commande`}
          color="purple"
          onClick={carte("EXPIRE")}
        />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <StatsChartCard title="Par offre" subtitle="Envoyés et taux d'utilisation" icon={Ticket}>
          <BarresRepartition
            lignes={c.par_offre.map((o) => ({ label: `${o.offre} (${fmtPct(o.taux)} utilisés)`, nombre: o.envoyes }))}
            vide="Aucun coupon envoyé sur la période."
          />
        </StatsChartCard>
        <StatsChartCard title="Par canal" subtitle="WhatsApp, SMS, ou code dicté" icon={Ticket}>
          <BarresRepartition
            couleur="#3B82F6"
            lignes={c.par_canal.map((x) => ({ label: CANAL_LABEL[x.canal as CanalCoupon] ?? x.canal, nombre: x.envoyes }))}
            vide="Aucun coupon envoyé sur la période."
          />
        </StatsChartCard>
      </div>
    </div>
  );
}
