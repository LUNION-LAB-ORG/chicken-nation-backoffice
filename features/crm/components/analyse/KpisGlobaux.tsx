import React from "react";
import StatsCard from "@/components/gestion/Statistiques/shared/StatsCard";
import { IVueEnsemble } from "../../types/analyse.type";
import { Public } from "../../types/contact.type";
import { compter, couvreCaptes, estCapte, fmtJours, fmtMontant, fmtNombre, fmtPct, vocabulaire } from "../../utils/crm-ui";

function Bloc({ titre, aide, children }: { titre: string; aide: string; children: React.ReactNode }) {
  return (
    <section>
      <div className="flex flex-wrap items-baseline gap-x-2 mb-2">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">{titre}</h3>
        <p className="text-xs text-gray-400">{aide}</p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">{children}</div>
    </section>
  );
}

/**
 * Deux blocs : les stocks d'aujourd'hui (sans période) et ce que la période
 * a donné. La file commune Glovo/Yango est à part : « Sans agent » ne compte
 * plus que les contacts ouverts que personne ne peut prendre.
 */
export function KpisGlobaux({ v, publics }: { v: IVueEnsemble; publics?: Public[] }) {
  const p = v.population;
  const c = v.conversion;
  const voc = vocabulaire(publics);
  const captes = couvreCaptes(publics);
  // Seuls Glovo/Yango : leurs captés du jour attendent demain pour entrer en file commune, ce n'est pas une alerte.
  const captesSeuls = !!publics?.length && publics.every(estCapte);
  const f = c.fenetre_jours;
  // Base du taux : ni les déjà clients Glovo/Yango, ni les clients repris qui avaient commandé avant d'entrer.
  const base = `sur ${compter(c.base_taux, "entré")}, hors ceux qui avaient déjà commandé`;

  return (
    <div className="space-y-4">
      <Bloc titre="Aujourd'hui" aide="stocks actuels, quelle que soit la période">
        <StatsCard title="Contacts ouverts" value={fmtNombre(p.ouverts)} subtitle={`${compter(p.jamais_appeles, "jamais appelé", "jamais appelés")}`} />
        <StatsCard
          title="Sans agent"
          value={fmtNombre(p.non_assignes)}
          subtitle={
            captesSeuls
              ? "hors file commune, captés du jour compris"
              : captes
                ? "hors file commune, à répartir (captés du jour compris : ils entrent demain en file commune)"
                : "hors file commune, à répartir"
          }
          color={captesSeuls ? "orange" : p.non_assignes > 0 ? "red" : "green"}
        />
        {captes && (
          <StatsCard title="File commune Glovo/Yango" value={fmtNombre(p.file_commune)} subtitle="pris par le premier agent libre" color="blue" />
        )}
        <StatsCard title="À rappeler" value={fmtNombre(p.a_rappeler)} color="purple" />
        <StatsCard title="Intéressés sans coupon" value={fmtNombre(p.interesses)} subtitle="coupon à envoyer" color="blue" />
        <StatsCard title="Coupons en attente" value={fmtNombre(p.coupons)} subtitle="envoyés, pas encore utilisés" />
        <StatsCard
          title="Pas intéressés"
          value={fmtNombre(p.non_interesses)}
          subtitle={`${compter(p.injoignables, "injoignable")}, sortis sans commande`}
        />
        <StatsCard
          title="Paiements abandonnés"
          value={fmtNombre(p.abandons)}
          subtitle="contacts bloqués au paiement en ligne"
          color={p.abandons > 0 ? "red" : "green"}
        />
      </Bloc>

      <Bloc
        titre="Sur la période"
        aide="contacts entrés sur la période, et ventes datées dans la période ; le stock repris à l'ouverture du CRM compte comme entré le jour de l'ouverture"
      >
        <StatsCard
          title={voc.taux}
          value={fmtPct(c.taux)}
          subtitle={
            c.delai_median_j != null
              ? `${base}, délai médian ${fmtJours(c.delai_median_j)}`
              : `${base}, aucune vente pour l'instant`
          }
          color="green"
        />
        <StatsCard
          /* Titre court : la pastille de la carte ne tient que sur une ligne. */
          title={`Taux à ${f} jours`}
          value={c.mesurables_30j > 0 ? fmtPct(c.taux_30j) : ""}
          subtitle={
            c.mesurables_30j > 0
              ? `${voc.taux.toLowerCase()} : ${fmtNombre(c.ventes_30j)} sur ${compter(c.mesurables_30j, "entré")} depuis au moins ${f} jours`
              : `entrés depuis moins de ${f} jours : trop tôt pour conclure`
          }
          color="green"
        />
        <StatsCard
          title="Ventes de la période"
          value={fmtNombre(c.conversions_periode)}
          subtitle={c.conversions_periode > 0 ? `panier moyen ${fmtMontant(c.panier_moyen)}` : "commandes annulées exclues"}
          color="green"
        />
        <StatsCard
          title="Chiffre d'affaires"
          value={fmtMontant(c.ca_periode)}
          subtitle={
            (c.historique?.ventes ?? 0) > 0
              ? `hors ancienne acquisition : ${compter(c.historique.ventes, "vente")}, ${fmtMontant(c.historique.ca)}`
              : "ventes du CRM seulement"
          }
          color="green"
        />
      </Bloc>
    </div>
  );
}
