import React from "react";
import StatsCard from "@/components/gestion/Statistiques/shared/StatsCard";
import { IVueEnsemble } from "../../types/analyse.type";
import { accord, fmtMontant, fmtNombre, fmtPct } from "../../utils/crm-ui";

/** Où en est la population, et ce que la conversion rapporte. */
export function KpisGlobaux({ v }: { v: IVueEnsemble }) {
  const p = v.population;
  const c = v.conversion;
  const commandes = v.entonnoir.find((e) => e.cle === "commandes")?.nombre ?? 0;
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <StatsCard title="Contacts actifs" value={fmtNombre(p.actifs)} subtitle={`${fmtNombre(p.jamais_appeles)} ${accord(p.jamais_appeles, "jamais appelé")}`} />
      <StatsCard title="Sans agent" value={fmtNombre(p.non_assignes)} subtitle="à répartir" color={p.non_assignes > 0 ? "red" : "green"} />
      <StatsCard
        title="Taux de conversion"
        value={fmtPct(c.taux)}
        subtitle={
          commandes > 0
            ? `${String(c.delai_moyen_jours).replace(".", ",")} j en moyenne après l'entrée`
            : "aucun contact entré sur la période n'a encore commandé"
        }
        color="green"
      />
      <StatsCard
        title="Conversions sur la période"
        value={fmtNombre(c.conversions_periode)}
        subtitle={c.conversions_periode > 0 ? `${fmtMontant(c.ca_periode)} · panier ${fmtMontant(c.panier_moyen)}` : undefined}
        color="green"
      />
      <StatsCard title="À rappeler" value={fmtNombre(p.a_rappeler)} color="purple" />
      <StatsCard title="Intéressés sans coupon" value={fmtNombre(p.interesses)} subtitle="coupon à envoyer" color="blue" />
      <StatsCard title="Coupons en attente" value={fmtNombre(p.coupons)} subtitle="envoyés, pas encore utilisés" />
      <StatsCard
        title="Paiements abandonnés"
        value={fmtNombre(p.abandons)}
        subtitle="contacts bloqués au paiement en ligne"
        color={p.abandons > 0 ? "red" : "green"}
      />
    </div>
  );
}
