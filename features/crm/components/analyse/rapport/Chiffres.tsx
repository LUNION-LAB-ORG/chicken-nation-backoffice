import React from "react";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { Compare, Taux } from "../../../types/analyse.type";
import { fmtMontant, fmtNombre, fmtPct, virgule } from "../../../utils/crm-ui";

const fmt = (c: Compare, n: number) => (c.monnaie ? fmtMontant(n) : fmtNombre(n));

/** « 41 avant », « 12 300 F avant », « aucun avant » : la valeur précédente quand le pourcentage ne veut rien dire. */
const avant = (c: Compare) => (c.precedent === 0 && !c.monnaie ? "aucun avant" : `${fmt(c, c.precedent)} avant`);

/**
 * La variation d'un chiffre comparé. La flèche et la couleur portent le
 * sens, le pourcentage le porte aussi : une couleur seule exclut ceux qui la
 * distinguent mal. Quand la base est trop petite (`comparable` à faux), on
 * donne la valeur d'avant plutôt qu'un pourcentage qui ferait douter du reste.
 */
export function Variation({ c }: { c: Compare }) {
  if (!c.comparable || c.variation === null) {
    return <p className="mt-0.5 text-[11px] font-semibold text-gray-400">{avant(c)}</p>;
  }
  const hausse = c.variation > 0;
  const baisse = c.variation < 0;
  const Fleche = hausse ? ArrowUpRight : baisse ? ArrowDownRight : Minus;
  const teinte = hausse ? "text-emerald-700" : baisse ? "text-rose-700" : "text-gray-500";
  return (
    <p className={`mt-0.5 flex flex-wrap items-center gap-x-1 text-[11px] font-semibold ${teinte}`}>
      <Fleche className="h-3.5 w-3.5 shrink-0" aria-hidden />
      {c.variation === 0 ? "stable" : `${hausse ? "+" : ""}${fmtPct(c.variation)}`}
      <span className="whitespace-nowrap font-normal text-gray-400">· {fmt(c, c.precedent)} avant</span>
    </p>
  );
}

/** Une carte de chiffre : valeur grande, libellé petit, ligne de comparaison. */
export function Chiffre({ libelle, c, accent }: { libelle: string; c: Compare; accent?: boolean }) {
  return (
    <div className="min-w-0 rounded-xl border border-gray-100 bg-gray-50/70 px-4 py-3">
      <p className="truncate text-[11px] font-semibold uppercase tracking-wide text-gray-500">{libelle}</p>
      <p className={`mt-1 truncate text-2xl font-bold tabular-nums ${accent ? "text-emerald-700" : "text-gray-900"}`}>{fmt(c, c.valeur)}</p>
      <Variation c={c} />
    </div>
  );
}

/** Une carte de taux : « 41,2 % », puis l'écart en points avec la période précédente. */
export function CarteTaux({ libelle, t, aide }: { libelle: string; t: Taux; aide?: string }) {
  const e = t.ecart_points;
  const Fleche = e > 0 ? ArrowUpRight : e < 0 ? ArrowDownRight : Minus;
  const teinte = e > 0 ? "text-emerald-700" : e < 0 ? "text-rose-700" : "text-gray-500";
  return (
    <div className="min-w-0 rounded-xl border border-gray-100 bg-gray-50/70 px-4 py-3">
      <p className="truncate text-[11px] font-semibold uppercase tracking-wide text-gray-500">{libelle}</p>
      <p className="mt-1 text-2xl font-bold tabular-nums text-gray-900">{fmtPct(t.valeur)}</p>
      <p className={`mt-0.5 flex flex-wrap items-center gap-x-1 text-[11px] font-semibold ${teinte}`}>
        <Fleche className="h-3.5 w-3.5 shrink-0" aria-hidden />
        {e === 0 ? "stable" : `${e > 0 ? "+" : ""}${virgule(e)} ${Math.abs(e) >= 2 ? "points" : "point"}`}
        <span className="whitespace-nowrap font-normal text-gray-400">· {fmtPct(t.precedent)} avant</span>
      </p>
      {aide && <p className="mt-1 text-[11px] text-gray-400">{aide}</p>}
    </div>
  );
}

/** Une carte de repère sans comparaison : délai médian, inscrits sans commande. */
export function Repere({ libelle, valeur, aide }: { libelle: string; valeur: string; aide?: string }) {
  return (
    <div className="min-w-0 rounded-xl border border-gray-100 bg-gray-50/70 px-4 py-3">
      <p className="truncate text-[11px] font-semibold uppercase tracking-wide text-gray-500">{libelle}</p>
      <p className="mt-1 text-2xl font-bold tabular-nums text-gray-900">{valeur || "non mesuré"}</p>
      {aide && <p className="mt-0.5 text-[11px] text-gray-400">{aide}</p>}
    </div>
  );
}

/** Grille des cartes d'une section : empilées sur téléphone, quatre par ligne sur grand écran. */
export function GrilleChiffres({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 lg:grid-cols-4">{children}</div>;
}
