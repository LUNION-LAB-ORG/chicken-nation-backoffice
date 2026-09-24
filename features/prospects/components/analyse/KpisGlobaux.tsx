import React from "react";
import StatsCard from "@/components/gestion/Statistiques/shared/StatsCard";
import { IVueEnsemble } from "../../types/analyse.type";
import { fmtMontant, fmtNombre, fmtPct } from "../../utils/prospect-ui";

/** Où en est la population, et ce que la conversion rapporte. */
export function KpisGlobaux({ v }: { v: IVueEnsemble }) {
  const p = v.population;
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <StatsCard title="Prospects actifs" value={fmtNombre(p.actifs)} subtitle={`${fmtNombre(p.jamais_appeles)} jamais appelés`} />
      <StatsCard title="Sans agent" value={fmtNombre(p.non_assignes)} subtitle="à répartir" color={p.non_assignes > 0 ? "red" : "green"} />
      <StatsCard
        title="Taux de conversion"
        value={fmtPct(v.conversion.taux)}
        subtitle={`${String(v.conversion.delai_moyen_jours).replace(".", ",")} j en moyenne après l'inscription`}
        color="green"
      />
      <StatsCard
        title="Conversions sur la période"
        value={fmtNombre(v.conversion.conversions_periode)}
        subtitle={`${fmtMontant(v.conversion.ca_periode)} · panier ${fmtMontant(v.conversion.panier_moyen)}`}
        color="green"
      />
      <StatsCard title="À rappeler" value={fmtNombre(p.a_rappeler)} color="purple" />
      <StatsCard title="Intéressés sans coupon" value={fmtNombre(p.interesses)} subtitle="coupon à envoyer" color="blue" />
      <StatsCard title="Coupons en attente" value={fmtNombre(p.coupons)} subtitle="envoyés, pas encore utilisés" />
      <StatsCard
        title="Paiements abandonnés"
        value={fmtNombre(p.abandons)}
        subtitle="prospects bloqués au paiement en ligne"
        color={p.abandons > 0 ? "red" : "green"}
      />
    </div>
  );
}
