import React from "react";
import StatsCard from "@/components/gestion/Statistiques/shared/StatsCard";
import { ICampagneStats } from "../../types/campagne.type";
import { accord, fmtMontant, fmtNombre, fmtPct, vocabulaire } from "../../utils/crm-ui";

/** Indicateurs clés d'une campagne (cahier §6.3), au vocabulaire de ses publics. */
export function KpisCampagne({ s }: { s: ICampagneStats }) {
  const i = s.indicateurs;
  const objectif = i.objectif_taux_conversion;
  const surObjectif = objectif != null ? i.taux_conversion >= objectif : null;
  const d = s.duree;
  const mots = vocabulaire((s.campagne.publics ?? []).map((p) => p.segment));
  const close = s.campagne.status === "COMPLETED";

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <StatsCard
        title="Ciblés"
        value={fmtNombre(i.cibles)}
        subtitle={`${fmtNombre(i.restants)} ${close ? `${accord(i.restants, "jamais appelé")} à la clôture` : `${accord(i.restants, "restant")} à appeler`}`}
      />
      <StatsCard title="Traités" value={fmtNombre(i.traites)} subtitle={`Couverture ${fmtPct(i.couverture)}`} color="blue" />
      <StatsCard
        title="Joints"
        value={fmtNombre(i.joints)}
        subtitle={`Taux de contact ${fmtPct(i.taux_contact)}${
          i.objectif_contacts
            ? ` · objectif ${fmtNombre(i.objectif_contacts)} à joindre${
                i.progression_objectif_contacts != null ? ` (${fmtPct(i.progression_objectif_contacts)})` : ""
              }`
            : ""
        }`}
        color="purple"
      />
      <StatsCard
        title={mots.conversion}
        value={fmtNombre(i.conversions)}
        subtitle={`${mots.taux} ${fmtPct(i.taux_conversion)}${objectif != null ? ` · objectif ${fmtPct(objectif)}` : ""}`}
        color={surObjectif === false ? "red" : "green"}
      />
      <StatsCard
        title="Coupons"
        value={`${fmtNombre(i.coupons_utilises)} / ${fmtNombre(i.coupons_envoyes)}`}
        subtitle={`utilisés / envoyés · ${fmtPct(i.taux_utilisation)}${i.ca_coupons ? ` · ${fmtMontant(i.ca_coupons)} de commandes` : ""}`}
      />
      <StatsCard title="Chiffre d'affaires" value={fmtMontant(i.ca_conversions)} subtitle={`Panier moyen ${fmtMontant(i.panier_moyen)}`} color="green" />
      <StatsCard
        title="Appels passés"
        value={fmtNombre(i.appels)}
        subtitle={`${i.traites ? (i.appels / i.traites).toFixed(1).replace(".", ",") : "0"} par contact traité`}
        color="blue"
      />
      <StatsCard
        title="Durée"
        value={`${String(d.reelle_jours).replace(".", ",")} j`}
        subtitle={d.planifiee_jours ? `sur ${d.planifiee_jours} j prévus` : "sans fin prévue"}
        color={d.planifiee_jours && d.reelle_jours > d.planifiee_jours ? "red" : "purple"}
      />
    </div>
  );
}
