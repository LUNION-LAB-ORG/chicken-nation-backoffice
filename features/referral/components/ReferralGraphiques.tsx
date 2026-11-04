"use client";

import React from "react";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import ChartTooltip from "@/components/gestion/Statistiques/shared/ChartTooltip";
import { AXIS_STYLE, CHART_COLORS, GRID_STYLE } from "../../statistics/utils/chart-config";
import { ReferralTableau } from "../types/referral.types";
import { fcfa, nombre } from "../utils/format";

type Courbe = ReferralTableau["courbe"];

/** « 02/11 » au jour, « nov. 26 » au mois. */
const dateCourte = (date: string, pas: Courbe["pas"]) => {
  if (pas === "jour") return `${date.slice(8, 10)}/${date.slice(5, 7)}`;
  const [annee, mois] = date.split("-").map(Number);
  return new Date(annee, mois - 1, 1).toLocaleDateString("fr-FR", { month: "short", year: "2-digit" });
};

/** « 2 novembre 2026 » ou « novembre 2026 ». */
const dateLongue = (date: string, pas: Courbe["pas"]) => {
  const [annee, mois, jour] = date.split("-").map(Number);
  return new Date(annee, mois - 1, jour || 1).toLocaleDateString("fr-FR", {
    ...(pas === "jour" ? { day: "numeric" as const } : {}),
    month: "long",
    year: "numeric",
  });
};

/** Montant court pour l'axe : 12 000 devient 12k. */
const axeMontant = (n: number) => (n >= 1000 ? `${Math.round(n / 1000)}k` : String(n));

const Carte: React.FC<{ titre: string; detail: string; children: React.ReactNode }> = ({
  titre,
  detail,
  children,
}) => (
  <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-4">
    <h3 className="text-sm font-bold text-gray-900">{titre}</h3>
    <p className="text-xs text-gray-500 mb-3">{detail}</p>
    {children}
  </div>
);

const Vide: React.FC<{ texte: string }> = ({ texte }) => (
  <p className="h-[220px] flex items-center justify-center text-sm text-gray-400">{texte}</p>
);

const parPas = (pas: Courbe["pas"]) => (pas === "jour" ? "Jour par jour" : "Mois par mois");

/** Filleuls par date d'inscription : ce qu'ils sont devenus. */
export function CourbeFilleuls({ courbe }: { courbe: Courbe }) {
  const { pas, points } = courbe;
  return (
    <Carte titre="Filleuls inscrits" detail={parPas(pas)}>
      {points.every((p) => p.qualifies + p.en_attente === 0) ? (
        <Vide texte="Aucun filleul sur cette période." />
      ) : (
        <div className="h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={points} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid {...GRID_STYLE} vertical={false} />
              <XAxis dataKey="date" tickFormatter={(d) => dateCourte(d, pas)} minTickGap={16} {...AXIS_STYLE} />
              <YAxis allowDecimals={false} {...AXIS_STYLE} />
              <Tooltip
                content={<ChartTooltip labelFormatter={(d) => dateLongue(d, pas)} />}
                cursor={{ fill: CHART_COLORS.primaryFaded }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} iconType="circle" />
              <Bar dataKey="qualifies" name="Qualifiés" stackId="f" fill={CHART_COLORS.success} maxBarSize={28} />
              <Bar
                dataKey="en_attente"
                name="En attente"
                stackId="f"
                fill={CHART_COLORS.primary}
                radius={[4, 4, 0, 0]}
                maxBarSize={28}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </Carte>
  );
}

/** Ventes des filleuls par date de commande. */
export function CourbeVentes({ courbe }: { courbe: Courbe }) {
  const { pas, points } = courbe;
  return (
    <Carte titre="Ventes générées" detail={parPas(pas)}>
      {points.every((p) => p.ventes === 0) ? (
        <Vide texte="Aucune vente sur cette période." />
      ) : (
        <div className="h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={points} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
              <CartesianGrid {...GRID_STYLE} vertical={false} />
              <XAxis dataKey="date" tickFormatter={(d) => dateCourte(d, pas)} minTickGap={16} {...AXIS_STYLE} />
              <YAxis tickFormatter={axeMontant} {...AXIS_STYLE} />
              <Tooltip
                content={
                  <ChartTooltip labelFormatter={(d) => dateLongue(d, pas)} valueFormatter={(v) => fcfa(v)} />
                }
                cursor={{ fill: CHART_COLORS.primaryFaded }}
              />
              <Bar dataKey="ventes" name="Ventes" fill={CHART_COLORS.blue} radius={[4, 4, 0, 0]} maxBarSize={28} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </Carte>
  );
}

const Etape: React.FC<{ label: string; valeur: number; total: number; couleur: string }> = ({
  label,
  valeur,
  total,
  couleur,
}) => {
  const part = total > 0 ? Math.round((valeur / total) * 100) : 0;
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2 text-sm">
        <span className="text-gray-700">{label}</span>
        <span className="font-bold text-gray-900">
          {nombre(valeur)} <span className="text-xs font-medium text-gray-500">{part} %</span>
        </span>
      </div>
      <div className="mt-1.5 h-2 rounded-full bg-gray-100 overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${part}%`, backgroundColor: couleur }} />
      </div>
    </div>
  );
};

/** Ce que deviennent les filleuls inscrits sur la période. */
export function ParcoursFilleuls({ filleuls }: { filleuls: ReferralTableau["filleuls"] }) {
  const { inscrits, ont_commande, qualifies, annules } = filleuls;
  return (
    <Carte titre="Parcours des filleuls" detail="Qualifié : cadeau utilisé sur une commande payée">
      {inscrits === 0 ? (
        <Vide texte="Aucun filleul sur cette période." />
      ) : (
        <div className="min-h-[220px] flex flex-col justify-center gap-5">
          <Etape label="Inscrits" valeur={inscrits} total={inscrits} couleur={CHART_COLORS.primary} />
          <Etape label="Ont commandé" valeur={ont_commande} total={inscrits} couleur={CHART_COLORS.blue} />
          <Etape label="Qualifiés" valeur={qualifies} total={inscrits} couleur={CHART_COLORS.success} />
          {annules > 0 && (
            <p className="text-xs text-gray-500">
              {nombre(annules)} parrainage{annules > 1 ? "s" : ""} annulé{annules > 1 ? "s" : ""}, non compté
              {annules > 1 ? "s" : ""}.
            </p>
          )}
        </div>
      )}
    </Carte>
  );
}
