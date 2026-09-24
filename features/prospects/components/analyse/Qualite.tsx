import React from "react";
import StatsCard from "@/components/gestion/Statistiques/shared/StatsCard";
import { IQualite } from "../../types/analyse.type";
import { fmtNombre, fmtPct } from "../../utils/prospect-ui";

const virgule = (n: number) => String(n).replace(".", ",");

/** Qualité du traitement (cahier §7). */
export function Qualite({ q }: { q: IQualite }) {
  const heures = q.traitement.heures_moyennes;
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <StatsCard
        title="Résolus au premier appel"
        value={fmtPct(q.resolution_premier_appel.taux)}
        subtitle={`${fmtNombre(q.resolution_premier_appel.resolus)} sur ${fmtNombre(q.resolution_premier_appel.traites)} traités`}
        color="blue"
      />
      <StatsCard
        title="Temps de traitement"
        value={heures >= 48 ? `${virgule(Math.round(heures / 2.4) / 10)} j` : `${virgule(heures)} h`}
        subtitle={`du premier appel à la qualification · ${virgule(q.traitement.tentatives_moyennes)} tentatives`}
        color="purple"
      />
      <StatsCard
        title="Appels par prospect"
        value={virgule(q.traitement.appels_par_prospect)}
        subtitle={`${fmtNombre(q.traitement.qualifies)} prospects qualifiés`}
      />
      <StatsCard
        title="Seconde commande"
        value={fmtPct(q.retention.taux)}
        subtitle={`${fmtNombre(q.retention.deuxieme_commande)} convertis sur ${fmtNombre(q.retention.convertis)} ont recommandé`}
        color="green"
      />
    </div>
  );
}
