import React from "react";
import StatsCard from "@/components/gestion/Statistiques/shared/StatsCard";
import { IQualite } from "../../types/analyse.type";
import { Public } from "../../types/contact.type";
import { accord, compter, estCapte, fmtHeures, fmtJours, fmtNombre, fmtPct, virgule } from "../../utils/crm-ui";

/** Ce qui précède la seconde commande, dans les mots du public. */
function apres(publics?: Public[]): string {
  if (!publics || publics.length === 0) return "après une vente du CRM";
  if (publics.every(estCapte)) return "après la commande directe";
  if (publics.length > 1) return "après une vente du CRM";
  return publics[0] === "INACTIF" ? "après la reconquête" : "après la première commande";
}

/**
 * Qualité du traitement, mesurée par passage, appels repris exclus : délai
 * du premier appel, traités à J+1 et J+2, résolution et effort, puis
 * seconde commande avant de redevenir inactif.
 */
export function Qualite({ q, publics }: { q: IQualite; publics?: Public[] }) {
  const { tentatives_moyennes: tentatives, qualifies, heures_moyennes, heures_medianes } = q.traitement;
  const pa = q.premier_appel;
  const s = q.seconde_commande;
  const f = s.fenetre_jours;
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <StatsCard
        title="Premier appel"
        value={fmtHeures(pa.premier_appel_median_h)}
        subtitle={
          pa.premier_appel_median_h != null
            ? `délai médian après l'entrée, sur ${compter(pa.entrees, "entré")}`
            : pa.entrees > 0
              ? `pas encore d'appel, sur ${compter(pa.entrees, "entré")}`
              : "aucun contact entré sur la période"
        }
        color="blue"
      />
      <StatsCard
        title="Traités à J+1"
        value={pa.mesurables_j1 > 0 ? fmtPct(pa.part_j1) : ""}
        subtitle={
          pa.mesurables_j1 > 0
            ? `${fmtNombre(pa.traites_j1)} sur ${fmtNombre(pa.mesurables_j1)}, appelés au plus tard le lendemain`
            : "entrés trop récents pour conclure"
        }
        color="blue"
      />
      <StatsCard
        title="Traités à J+2"
        value={pa.mesurables_j2 > 0 ? fmtPct(pa.part_j2) : ""}
        subtitle={
          pa.mesurables_j2 > 0
            ? `${fmtNombre(pa.traites_j2)} sur ${fmtNombre(pa.mesurables_j2)}, appelés au plus tard le surlendemain`
            : "entrés trop récents pour conclure"
        }
        color="blue"
      />
      <StatsCard
        title="Résolus au premier appel"
        value={fmtPct(q.resolution_premier_appel.taux)}
        subtitle={`${fmtNombre(q.resolution_premier_appel.resolus)} sur ${compter(q.resolution_premier_appel.traites, "traité")}`}
        color="blue"
      />
      <StatsCard
        title="Temps de traitement"
        value={qualifies > 0 ? fmtHeures(heures_medianes ?? heures_moyennes) : ""}
        subtitle={
          qualifies > 0
            ? `${heures_medianes != null ? "médian" : "moyen"}, du premier appel à la qualification, ${virgule(tentatives)} ${accord(
                tentatives,
                "tentative",
              )} en moyenne`
            : "aucun contact qualifié sur la période"
        }
        color="purple"
      />
      <StatsCard
        title="Appels par contact"
        value={virgule(q.traitement.appels_par_contact)}
        subtitle={compter(qualifies, "contact qualifié", "contacts qualifiés")}
      />
      <StatsCard
        title={`Seconde commande sous ${f} jours`}
        value={s.mesurables > 0 ? fmtPct(s.taux_30j) : ""}
        subtitle={
          s.mesurables > 0
            ? `${fmtNombre(s.recommande_30j)} sur ${compter(s.mesurables, "vente mesurable", "ventes mesurables")} ${apres(publics)}${
                s.delai_median_j != null ? `, délai médian ${fmtJours(s.delai_median_j)}` : ""
              }`
            : s.ventes > 0
              ? "aucune vente assez ancienne pour conclure"
              : "aucune vente sur la période"
        }
        color="green"
      />
      <StatsCard
        title="Ventes suivies"
        value={fmtNombre(s.ventes)}
        subtitle={`${fmtNombre(s.non_mesurables)} non ${accord(s.non_mesurables, "mesurable")} (sans compte), ${fmtNombre(
          s.en_attente,
        )} trop ${accord(s.en_attente, "récente")} pour conclure`}
      />
    </div>
  );
}
