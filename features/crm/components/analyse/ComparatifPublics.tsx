import React, { useState } from "react";
import { Download, Loader2, Table2 } from "lucide-react";
import { toast } from "react-hot-toast";
import StatsChartCard from "@/components/gestion/Statistiques/shared/StatsChartCard";
import { analyseAPI } from "../../apis/analyse.api";
import { useComparatifPublicsQuery } from "../../queries/analyse.query";
import { ILignePublic, IPeriode } from "../../types/analyse.type";
import { Public } from "../../types/contact.type";
import { fmtHeures, fmtJours, fmtMontant, fmtNombre, fmtPct } from "../../utils/crm-ui";
import { Bouton } from "../commun/Champs";
import { EtatRequete } from "../commun/Etats";

interface Colonne {
  titre: string;
  aide?: string;
  valeur: (l: ILignePublic) => string;
  accent?: boolean;
}

interface Groupe {
  titre: string;
  colonnes: Colonne[];
}

/**
 * Colonnes groupées, dans l'ordre de l'export Excel. `f` = délai d'inactivité
 * réglé, en jours. Les colonnes propres à Glovo/Yango n'apparaissent que si
 * un public capté est couvert.
 */
function groupes(f: number, historique: boolean, captes: boolean): Groupe[] {
  const activite: Colonne[] = [
    { titre: "Appels", valeur: (l) => fmtNombre(l.activite.appels) },
    { titre: "Joints", valeur: (l) => fmtNombre(l.activite.appels_joints) },
    { titre: "Coupons envoyés", valeur: (l) => fmtNombre(l.activite.coupons_envoyes) },
    { titre: "Coupons utilisés", valeur: (l) => fmtNombre(l.activite.coupons_utilises) },
    { titre: "Remises", aide: "remise totale des commandes payées par coupon", valeur: (l) => fmtMontant(l.activite.remises_coupons) },
    { titre: "Ventes", valeur: (l) => fmtNombre(l.activite.ventes_crm), accent: true },
    { titre: "Chiffre d'affaires", valeur: (l) => fmtMontant(l.activite.ca_crm) },
    { titre: "Panier moyen", valeur: (l) => (l.activite.ventes_crm > 0 ? fmtMontant(l.activite.panier_moyen) : "") },
  ];
  if (historique) {
    activite.push(
      { titre: "Historique acquisition", aide: "ventes de l'ancienne acquisition, hors chiffres du CRM", valeur: (l) => fmtNombre(l.activite.ventes_historiques) },
      { titre: "CA historique", valeur: (l) => fmtMontant(l.activite.ca_historique) },
    );
  }
  return [
    {
      titre: "Entrés sur la période",
      colonnes: [
        { titre: "Entrés", valeur: (l) => fmtNombre(l.devenir.entrees) },
        { titre: "Contactés", valeur: (l) => `${fmtNombre(l.devenir.contactes)} · ${fmtPct(l.devenir.taux_contact)}` },
        { titre: "Joints", valeur: (l) => fmtNombre(l.devenir.joints) },
        { titre: "Coupon envoyé", valeur: (l) => fmtNombre(l.devenir.coupons) },
        { titre: "Ventes", aide: "toutes les ventes des entrés, hors entonnoir comprises", valeur: (l) => fmtNombre(l.devenir.ventes), accent: true },
        { titre: "dont sans contact", valeur: (l) => fmtNombre(l.devenir.sans_contact) },
        { titre: "Taux", aide: "conversion, reconquête ou passage en direct, hors clients qui avaient déjà commandé", valeur: (l) => fmtPct(l.devenir.taux_conversion), accent: true },
        {
          titre: `Taux à ${f} j`,
          aide: `entrés depuis au moins ${f} jours`,
          valeur: (l) => (l.devenir.mesurables_30j > 0 ? fmtPct(l.devenir.taux_30j) : ""),
        },
        { titre: "Délai médian", aide: "de l'entrée à la vente", valeur: (l) => fmtJours(l.devenir.delai_median_j) },
        { titre: "Premier appel", aide: "délai médian après l'entrée", valeur: (l) => fmtHeures(l.devenir.premier_appel_median_h) },
        { titre: "Traités à J+1", valeur: (l) => (l.devenir.mesurables_j1 > 0 ? fmtPct(l.devenir.part_j1) : "") },
        ...(captes
          ? [{ titre: "Déjà clients", aide: "Glovo/Yango : déjà clients de l'appli, hors taux", valeur: (l: ILignePublic) => fmtNombre(l.devenir.deja_clients) }]
          : []),
        { titre: "Chiffre d'affaires", valeur: (l) => fmtMontant(l.devenir.ca) },
      ],
    },
    { titre: "Activité de la période", colonnes: activite },
    {
      titre: "Aujourd'hui",
      colonnes: [
        { titre: "Ouverts", valeur: (l) => fmtNombre(l.aujourdhui.ouverts) },
        { titre: "Jamais appelés", valeur: (l) => fmtNombre(l.aujourdhui.jamais_appeles) },
        { titre: "À rappeler", valeur: (l) => fmtNombre(l.aujourdhui.a_rappeler) },
        ...(captes
          ? [{ titre: "File commune", aide: "Glovo/Yango : pris par le premier agent libre", valeur: (l: ILignePublic) => fmtNombre(l.aujourdhui.file_commune) }]
          : []),
        { titre: "Sans agent", aide: "ouverts, sans agent ni campagne, hors file commune", valeur: (l) => fmtNombre(l.aujourdhui.sans_agent_hors_file) },
        { titre: "En campagne", valeur: (l) => fmtNombre(l.aujourdhui.en_campagne) },
      ],
    },
    {
      titre: "Seconde commande",
      colonnes: [
        { titre: "Ventes suivies", valeur: (l) => fmtNombre(l.seconde_commande.ventes) },
        {
          titre: `Sous ${f} j`,
          aide: `nouvelle commande dans les ${f} jours, sur les ventes mesurables`,
          valeur: (l) =>
            l.seconde_commande.mesurables > 0
              ? `${fmtNombre(l.seconde_commande.recommande_30j)} · ${fmtPct(l.seconde_commande.taux_30j)}`
              : "",
          accent: true,
        },
        { titre: "Non mesurables", aide: "vente d'un contact sans compte appli", valeur: (l) => fmtNombre(l.seconde_commande.non_mesurables) },
        { titre: "Trop récentes", aide: `vente il y a moins de ${f} jours`, valeur: (l) => fmtNombre(l.seconde_commande.en_attente) },
        { titre: "Délai médian", valeur: (l) => fmtJours(l.seconde_commande.delai_median_j) },
      ],
    },
  ];
}

/** Publics choisis par un clic sur une ligne : un public, ou Glovo + Yango. */
const publicsDeLigne = (l: ILignePublic): Public[] | null =>
  l.segment ? [l.segment] : l.cle === "CAPTES" ? ["GLOVO", "YANGO"] : null;

/**
 * Vue comparée : une ligne par public, la ligne « Glovo + Yango » quand les
 * deux sont couverts, puis le total. Un clic sur une ligne ouvre le détail
 * de ce public.
 */
export function ComparatifPublics({
  periode,
  peutExporter,
  onChoisir,
}: {
  periode: IPeriode;
  peutExporter?: boolean;
  onChoisir: (publics: Public[]) => void;
}) {
  const requete = useComparatifPublicsQuery(periode);
  const [export_, setExport] = useState(false);
  const d = requete.data;

  const exporter = async () => {
    setExport(true);
    try {
      await analyseAPI.exporterPublics(periode);
      toast.success("Export téléchargé, et inscrit à l'historique");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setExport(false);
    }
  };

  const lignes = d ? [...d.lignes, ...(d.glovo_yango ? [d.glovo_yango] : []), d.total] : [];
  const historique = lignes.some((l) => l.activite.ventes_historiques > 0);
  const captes = lignes.some((l) => l.devenir.captes != null);
  const g = d ? groupes(d.fenetre_jours, historique, captes) : [];

  return (
    <StatsChartCard
      title="Vue comparée des publics"
      subtitle="Cliquez sur une ligne pour voir le détail de ce public"
      icon={Table2}
      rightContent={
        peutExporter ? (
          <Bouton onClick={exporter} desactive={export_ || !d}>
            {export_ ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            Exporter
          </Bouton>
        ) : undefined
      }
    >
      <EtatRequete requete={requete}>
        {d && (
          <>
            <div className="overflow-x-auto -mx-5">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[11px] uppercase text-gray-500">
                    <th className="sticky left-0 bg-white" />
                    {g.map((gr) => (
                      <th key={gr.titre} colSpan={gr.colonnes.length} className="font-semibold px-3 pt-1 pb-1.5 text-center border-l border-gray-100 whitespace-nowrap">
                        {gr.titre}
                      </th>
                    ))}
                  </tr>
                  <tr className="text-gray-500 text-xs">
                    <th className="sticky left-0 bg-white font-semibold text-left px-5 py-2 whitespace-nowrap">Public</th>
                    {g.map((gr) =>
                      gr.colonnes.map((c, i) => (
                        <th
                          key={`${gr.titre}-${c.titre}`}
                          title={c.aide}
                          className={`font-semibold text-right px-3 py-2 whitespace-nowrap ${i === 0 ? "border-l border-gray-100" : ""} ${c.aide ? "cursor-help" : ""}`}
                        >
                          {c.titre}
                        </th>
                      )),
                    )}
                  </tr>
                </thead>
                <tbody>
                  {lignes.map((l) => {
                    const choix = publicsDeLigne(l);
                    const total = l.cle === "TOTAL";
                    const sousTotal = l.cle === "CAPTES";
                    return (
                      <tr
                        key={l.cle}
                        onClick={choix ? () => onChoisir(choix) : undefined}
                        onKeyDown={choix ? (e) => e.key === "Enter" && onChoisir(choix) : undefined}
                        tabIndex={choix ? 0 : undefined}
                        className={`group border-t ${total ? "border-gray-300 font-bold" : "border-gray-100"} ${sousTotal ? "bg-gray-50/70" : ""} ${
                          choix ? "cursor-pointer hover:bg-orange-50/60 focus:outline-none focus-visible:bg-orange-50/60" : ""
                        }`}
                      >
                        <td
                          className={`sticky left-0 px-5 py-2.5 whitespace-nowrap text-left ${total ? "bg-white text-gray-900" : sousTotal ? "bg-gray-50 text-gray-700" : "bg-white text-gray-800"} ${
                            total ? "" : "font-semibold"
                          } ${choix ? "group-hover:bg-orange-50 group-focus-visible:bg-orange-50" : ""}`}
                        >
                          {l.libelle}
                        </td>
                        {g.map((gr) =>
                          gr.colonnes.map((c, i) => (
                            <td
                              key={`${gr.titre}-${c.titre}`}
                              className={`px-3 py-2.5 text-right tabular-nums whitespace-nowrap ${i === 0 ? "border-l border-gray-100" : ""} ${
                                c.accent && !total ? "font-semibold text-emerald-700" : ""
                              }`}
                            >
                              {c.valeur(l)}
                            </td>
                          )),
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="mt-3 space-y-1 text-xs text-gray-500">
              <p>
                <strong>Entrés sur la période</strong> : contacts entrés au CRM sur la période, suivis jusqu&apos;à aujourd&apos;hui ; le
                stock repris à l&apos;ouverture compte le jour de l&apos;ouverture. <strong>Activité</strong> : appels, coupons et ventes
                datés dans la période. <strong>Aujourd&apos;hui</strong> : stocks actuels, quelle que soit la période.
              </p>
              <p>
                Taux : conversion pour les inscrits, reconquête pour les inactifs, passage en direct pour Glovo et Yango, hors déjà
                clients de l&apos;appli. Une case vide : non disponible, ou sans objet pour ce public. Les taux et les délais ne
                s&apos;additionnent pas d&apos;une ligne à l&apos;autre.
              </p>
            </div>
          </>
        )}
      </EtatRequete>
    </StatsChartCard>
  );
}
