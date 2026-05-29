"use client";

import React from "react";
import { Coins, Gift, TrendingDown, Users } from "lucide-react";

import { useLoyaltyStatsQuery } from "../queries/loyalty.queries";
import { LoyaltyStatCard } from "./LoyaltyStatCard";

/** Formatage compact des montants FCFA (M / k). */
function formatFcfa(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return Math.round(n).toLocaleString("fr-FR");
}

/** Formatage compact des nombres de points (M / k). */
function formatPoints(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return n.toLocaleString("fr-FR");
}

/**
 * En-tête KPI de la page Fidélité :
 *  - Points distribués (cumul lifetime) + valeur XOF
 *  - En circulation (engagement à honorer) + valeur XOF
 *  - Points utilisés (rachetés sur commandes) + taux d'utilisation
 *  - Clients éligibles (atteignent le seuil minimum de rachat)
 *
 * Auto-suffisant : la card embarque sa propre requête (stats globales, sans
 * filtre), donc la page parent n'a qu'à poser `<LoyaltyKpiRow />`.
 */
export function LoyaltyKpiRow() {
  const { data: stats, isLoading } = useLoyaltyStatsQuery();

  if (isLoading && !stats) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-white rounded-3xl border border-gray-100 h-32 animate-pulse"
          />
        ))}
      </div>
    );
  }

  const distributed = stats?.points_distributed ?? 0;
  const available = stats?.points_available ?? 0;
  const redeemed = stats?.points_redeemed ?? 0;
  const usageRate = distributed > 0 ? Math.round((redeemed / distributed) * 100) : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <LoyaltyStatCard
        badgeText="Points distribués"
        badgeColor="#F17922"
        icon={Gift}
        iconColor="#F17922"
        value={formatPoints(distributed)}
        unit="pts"
        subtitle={`≈ ${formatFcfa(stats?.points_distributed_xof ?? 0)} FCFA cumulés`}
      />
      <LoyaltyStatCard
        badgeText="En circulation"
        badgeColor="#007AFF"
        icon={Coins}
        iconColor="#007AFF"
        value={formatPoints(available)}
        unit="pts"
        subtitle={`≈ ${formatFcfa(stats?.points_available_xof ?? 0)} FCFA à honorer`}
      />
      <LoyaltyStatCard
        badgeText="Points utilisés"
        badgeColor="#4FCB71"
        icon={TrendingDown}
        iconColor="#4FCB71"
        value={formatPoints(redeemed)}
        unit="pts"
        subtitle={`≈ ${formatFcfa(stats?.points_redeemed_xof ?? 0)} FCFA`}
        progress={usageRate}
        progressLabel="Taux d'utilisation"
      />
      <LoyaltyStatCard
        badgeText="Clients éligibles"
        badgeColor="#8B5CF6"
        icon={Users}
        iconColor="#8B5CF6"
        value={(stats?.eligible_customers ?? 0).toLocaleString("fr-FR")}
        subtitle={`seuil ≥ ${stats?.minimum_redemption_points ?? 0} pts · ${(stats?.customers_with_points ?? 0).toLocaleString("fr-FR")} avec points`}
      />
    </div>
  );
}
