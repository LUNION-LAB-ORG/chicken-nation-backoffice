import React from "react";
import StatsCard from "@/components/gestion/Statistiques/shared/StatsCard";
import { IQualite } from "../../types/analyse.type";
import { accord, fmtNombre, fmtPct } from "../../utils/crm-ui";

const virgule = (n: number) => String(n).replace(".", ",");

/** Qualité du traitement (cahier §7). */
export function Qualite({ q }: { q: IQualite }) {
  const heures = q.traitement.heures_moyennes;
  const { tentatives_moyennes: tentatives, qualifies } = q.traitement;
  const r = q.retention;
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <StatsCard
        title="Résolus au premier appel"
        value={fmtPct(q.resolution_premier_appel.taux)}
        subtitle={`${fmtNombre(q.resolution_premier_appel.resolus)} sur ${fmtNombre(q.resolution_premier_appel.traites)} ${accord(q.resolution_premier_appel.traites, "traité")}`}
        color="blue"
      />
      <StatsCard
        title="Temps de traitement"
        value={heures >= 48 ? `${virgule(Math.round(heures / 2.4) / 10)} j` : `${virgule(heures)} h`}
        subtitle={
          qualifies > 0
            ? `du premier appel à la qualification, ${virgule(tentatives)} ${accord(tentatives, "tentative")} en moyenne`
            : "aucun contact qualifié sur la période"
        }
        color="purple"
      />
      <StatsCard
        title="Appels par contact"
        value={virgule(q.traitement.appels_par_contact)}
        subtitle={`${fmtNombre(qualifies)} ${accord(qualifies, "contact qualifié", "contacts qualifiés")}`}
      />
      <StatsCard
        title="Seconde commande"
        value={fmtPct(r.taux)}
        subtitle={
          r.convertis > 0
            ? `${fmtNombre(r.deuxieme_commande)} sur ${fmtNombre(r.convertis)} ${accord(r.convertis, "converti")}`
            : "aucun converti sur la période"
        }
        color="green"
      />
    </div>
  );
}
