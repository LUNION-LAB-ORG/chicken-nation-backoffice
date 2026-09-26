import React from "react";
import StatsCard from "@/components/gestion/Statistiques/shared/StatsCard";
import { ICampagneStats } from "../../types/campagne.type";
import { accord, fmtMontant, fmtNombre, fmtPct, vocabulaire } from "../../utils/crm-ui";

/**
 * Carte qui mène à la liste des ventes. La carte réagit au clic ; cette
 * enveloppe la rend joignable au clavier (Tab, puis Entrée ou Espace) et
 * l'annonce comme un bouton, sans doubler le clic.
 */
function VersVentes({ libelle, onActiver, children }: { libelle: string; onActiver?: () => void; children: React.ReactNode }) {
  if (!onActiver) return <>{children}</>;
  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={libelle}
      title="Voir les clients qui ont commandé"
      onKeyDown={(e) => {
        if (e.key !== "Enter" && e.key !== " ") return;
        e.preventDefault();
        onActiver();
      }}
      className="flex rounded-3xl focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F17922] focus-visible:ring-offset-2"
    >
      {children}
    </div>
  );
}

/** Indicateurs clés d'une campagne (cahier §6.3), au vocabulaire de ses publics. */
export function KpisCampagne({
  s,
  onVoirVentes,
}: {
  s: ICampagneStats;
  /** Ventes et chiffre d'affaires : un clic fait défiler jusqu'à la liste des clients qui ont commandé. */
  onVoirVentes?: () => void;
}) {
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
      <VersVentes libelle={`${mots.conversion} : ${fmtNombre(i.conversions)}. Voir les clients qui ont commandé`} onActiver={onVoirVentes}>
        <StatsCard
          title={mots.conversion}
          value={fmtNombre(i.conversions)}
          subtitle={`${mots.taux} ${fmtPct(i.taux_conversion)}${objectif != null ? ` · objectif ${fmtPct(objectif)}` : ""}`}
          color={surObjectif === false ? "red" : "green"}
          onClick={onVoirVentes}
        />
      </VersVentes>
      <StatsCard
        title="Coupons"
        value={`${fmtNombre(i.coupons_utilises)} / ${fmtNombre(i.coupons_envoyes)}`}
        subtitle={`utilisés / envoyés · ${fmtPct(i.taux_utilisation)}${i.ca_coupons ? ` · ${fmtMontant(i.ca_coupons)} de commandes` : ""}`}
      />
      <VersVentes libelle={`Chiffre d'affaires : ${fmtMontant(i.ca_conversions)}. Voir les clients qui ont commandé`} onActiver={onVoirVentes}>
        <StatsCard
          title="Chiffre d'affaires"
          value={fmtMontant(i.ca_conversions)}
          subtitle={`Panier moyen ${fmtMontant(i.panier_moyen)}`}
          color="green"
          onClick={onVoirVentes}
        />
      </VersVentes>
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
