"use client";

import React, { useState } from "react";
import { ArrowDownRight, ArrowRight, ArrowUpRight, FileDown, Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";
import StatsChartCard from "@/components/gestion/Statistiques/shared/StatsChartCard";
import { analyseAPI } from "../../apis/analyse.api";
import { useRapportQuery } from "../../queries/analyse.query";
import { IChiffreCle, IPeriode, ITauxCompare } from "../../types/analyse.type";
import { fmtMontant, fmtNombre, fmtPct } from "../../utils/crm-ui";
import { ChoixPublics } from "../commun/ChoixPublics";
import { Chargement, Erreur } from "../commun/Etats";
import { FiltrePeriode } from "../commun/FiltrePeriode";

const jj = (v: string) => v.split("-").reverse().join("/");

/**
 * Un chiffre clé et son évolution.
 *
 * La flèche et la couleur portent le sens, le pourcentage le porte aussi :
 * c'est volontaire. Une couleur seule exclut ceux qui la distinguent mal, et
 * un rapport se lit aussi imprimé en noir et blanc.
 */
function Cle({ c }: { c: IChiffreCle }) {
  const hausse = (c.variation ?? 0) > 0;
  const baisse = (c.variation ?? 0) < 0;
  const Fleche = hausse ? ArrowUpRight : baisse ? ArrowDownRight : ArrowRight;
  const teinte = hausse ? "text-emerald-700" : baisse ? "text-rose-700" : "text-gray-500";

  return (
    <div className="rounded-xl border border-gray-200 bg-white px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">{c.libelle}</p>
      <p className="mt-1 text-2xl font-bold tabular-nums text-gray-900">
        {c.monnaie ? fmtMontant(c.valeur) : fmtNombre(c.valeur)}
      </p>
      {/*
        `variation` à null veut dire « la période précédente était à zéro ».
        Une progression depuis zéro est infinie : on écrit « nouveau » plutôt
        qu'un pourcentage qui ferait douter de tout le reste du rapport.
      */}
      {c.variation === null ? (
        <p className="mt-0.5 text-[11px] font-semibold text-gray-400">
          {c.valeur > 0 ? "nouveau sur la période" : "aucun, comme avant"}
        </p>
      ) : (
        <p className={`mt-0.5 flex items-center gap-1 text-[11px] font-semibold ${teinte}`}>
          <Fleche className="h-3.5 w-3.5 shrink-0" />
          {c.variation > 0 ? "+" : ""}
          {fmtPct(c.variation)}
          <span className="font-normal text-gray-400">
            · {c.monnaie ? fmtMontant(c.precedent) : fmtNombre(c.precedent)} avant
          </span>
        </p>
      )}
    </div>
  );
}

function Taux({ libelle, t, aide }: { libelle: string; t: ITauxCompare; aide: string }) {
  const ecart = Math.round((t.valeur - t.precedent) * 10) / 10;
  return (
    <div className="rounded-xl border border-gray-200 bg-white px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">{libelle}</p>
      <p className="mt-1 text-xl font-bold tabular-nums text-gray-900">{fmtPct(t.valeur)}</p>
      <p className="mt-0.5 text-[11px] text-gray-400">
        {ecart === 0 ? "identique" : `${ecart > 0 ? "+" : ""}${fmtPct(ecart)} points`} · {aide}
      </p>
    </div>
  );
}

const Ligne = ({ cle, valeur }: { cle: string; valeur: React.ReactNode }) => (
  <div className="flex items-baseline justify-between gap-3 border-b border-gray-100 py-1.5 last:border-0">
    <span className="text-sm text-gray-600">{cle}</span>
    <span className="text-sm font-semibold tabular-nums text-gray-900">{valeur}</span>
  </div>
);

/**
 * RAPPORT D'ACTIVITÉ : la période face à la précédente.
 *
 * Tout était déjà calculé, mais réparti sur huit vues. Ce que ce rapport
 * ajoute, c'est la comparaison : un nombre absolu ne dit pas si l'action
 * porte. Chaque chiffre est donc donné avec ce qu'il valait sur la période
 * précédente de même durée.
 */
export function Rapport() {
  const [periode, setPeriode] = useState<IPeriode>({});
  const [exportEnCours, setExportEnCours] = useState(false);
  const requete = useRapportQuery(periode);
  const r = requete.data;

  const exporter = async () => {
    setExportEnCours(true);
    try {
      await analyseAPI.rapportPdf(periode);
      toast.success("Rapport téléchargé");
    } catch (e) {
      toast.error((e as Error)?.message || "Export impossible");
    } finally {
      setExportEnCours(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <FiltrePeriode valeur={periode} onChange={setPeriode} />
          <ChoixPublics
            valeur={periode.segments}
            onChange={(segments) => setPeriode((p) => ({ ...p, segments }))}
          />
        </div>
        <button
          type="button"
          onClick={exporter}
          disabled={exportEnCours || !r}
          className="inline-flex items-center gap-2 rounded-lg bg-[#F17922] px-3.5 py-2 text-sm font-semibold text-white hover:bg-[#e06a15] disabled:opacity-50 cursor-pointer"
        >
          {exportEnCours ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
          Exporter en PDF
        </button>
      </div>

      {requete.isError ? (
        <Erreur message={(requete.error as Error)?.message} />
      ) : !r ? (
        <Chargement />
      ) : (
        <>
          <p className="text-xs text-gray-500">
            Du <span className="font-semibold text-gray-700">{jj(r.periode.debut)}</span> au{" "}
            <span className="font-semibold text-gray-700">{jj(r.periode.fin)}</span> ({r.periode.jours} jour
            {r.periode.jours > 1 ? "s" : ""}), comparé au {jj(r.precedente.debut)} – {jj(r.precedente.fin)}.
          </p>

          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {r.cles.map((c) => (
              <Cle key={c.cle} c={c} />
            ))}
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Taux libelle="Taux de contact" t={r.taux.contact} aide="joints sur appels" />
            <Taux libelle="Taux de conversion" t={r.taux.conversion} aide="conversions sur entrées" />
            <Taux libelle="Coupons utilisés" t={r.taux.coupon_utilise} aide="conversions sur coupons" />
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <StatsChartCard title="Par public" subtitle="Ventes et taux de conversion sur la période">
              {r.entonnoirs.length === 0 ? (
                <p className="py-6 text-center text-sm text-gray-400">Aucun public sur la période.</p>
              ) : (
                r.entonnoirs.map((e) => (
                  <Ligne
                    key={e.segment}
                    cle={e.libelle}
                    valeur={`${fmtNombre(e.ventes)} vente${e.ventes > 1 ? "s" : ""} · ${fmtPct(e.taux_conversion ?? 0)}`}
                  />
                ))
              )}
            </StatsChartCard>

            <StatsChartCard title="État du portefeuille" subtitle="À la date du rapport">
              <Ligne cle="Contacts ouverts" valeur={fmtNombre(r.population.ouverts ?? 0)} />
              <Ligne cle="Jamais appelés" valeur={fmtNombre(r.population.jamais_appeles ?? 0)} />
              <Ligne cle="Non assignés" valeur={fmtNombre(r.population.non_assignes ?? 0)} />
              <Ligne cle="À rappeler" valeur={fmtNombre(r.population.a_rappeler ?? 0)} />
              <Ligne cle="Intéressés" valeur={fmtNombre(r.population.interesses ?? 0)} />
              <Ligne cle="Coupon envoyé" valeur={fmtNombre(r.population.coupons ?? 0)} />
            </StatsChartCard>

            <StatsChartCard title="Qualité du traitement" subtitle="Effort réel derrière les chiffres">
              <Ligne
                cle="Résolus au premier appel"
                valeur={`${fmtNombre(r.qualite.resolution_premier_appel.resolus)} / ${fmtNombre(
                  r.qualite.resolution_premier_appel.traites,
                )} · ${fmtPct(r.qualite.resolution_premier_appel.taux)}`}
              />
              <Ligne cle="Tentatives moyennes" valeur={fmtNombre(r.qualite.traitement.tentatives_moyennes)} />
              <Ligne cle="Appels par contact" valeur={fmtNombre(r.qualite.traitement.appels_par_contact)} />
              <Ligne
                cle="Délai médian avant commande"
                valeur={r.conversion.delai_median_j != null ? `${fmtNombre(r.conversion.delai_median_j)} j` : "—"}
              />
            </StatsChartCard>

            <StatsChartCard title="Raisons de non-commande" subtitle="Les plus fréquentes sur la période">
              {(r.raisons?.raisons ?? []).length === 0 ? (
                <p className="py-6 text-center text-sm text-gray-400">Aucune raison saisie.</p>
              ) : (
                r.raisons.raisons.slice(0, 8).map((x) => (
                  <Ligne key={x.id ?? x.raison} cle={x.raison} valeur={fmtNombre(x.nombre)} />
                ))
              )}
            </StatsChartCard>
          </div>

          <StatsChartCard title="Performance par agent" subtitle="Sur la période choisie">
            {(r.agents?.lignes ?? []).length === 0 ? (
              <p className="py-6 text-center text-sm text-gray-400">Aucun agent sur la période.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[520px] text-sm">
                  <thead>
                    <tr className="text-xs uppercase text-gray-500">
                      {["Agent", "Traités", "Joints", "Coupons", "Ventes", "CA"].map((c, i) => (
                        <th key={c} className={`px-3 py-2 font-semibold ${i === 0 ? "text-left" : "text-right"}`}>
                          {c}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {r.agents.lignes.map((a) => (
                      <tr key={a.id} className="border-t border-gray-100">
                        <td className="px-3 py-2 font-semibold text-gray-800">{a.fullname}</td>
                        <td className="px-3 py-2 text-right tabular-nums">{fmtNombre(a.traites)}</td>
                        <td className="px-3 py-2 text-right tabular-nums">{fmtNombre(a.joints)}</td>
                        <td className="px-3 py-2 text-right tabular-nums">{fmtNombre(a.coupons)}</td>
                        <td className="px-3 py-2 text-right font-semibold tabular-nums text-emerald-700">
                          {fmtNombre(a.conversions)}
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums">{fmtMontant(a.ca)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </StatsChartCard>
        </>
      )}
    </div>
  );
}
