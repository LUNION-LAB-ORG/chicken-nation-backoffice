"use client";

import React from "react";

import { GenericStatCard } from "@/components/gestion/Dashboard/GenericStatCard";

type CardColor = "orange" | "green" | "blue" | "purple" | "red";

const COLOR_HEX: Record<CardColor, string> = {
  orange: "#F17922",
  green: "#16A34A",
  blue: "#4285F4",
  purple: "#7C3AED",
  red: "#EA4335",
};

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: { label: string; color: string; arrow: string };
  color?: CardColor;
  onClick?: () => void;
  active?: boolean;
}

/**
 * `StatsCard` est désormais un **adaptateur** au-dessus de `GenericStatCard`
 * (le composant KPI du tableau de bord principal), pour une carte de stats
 * unique dans toute l'application.
 *
 * Mapping : title → badge, subtitle (+ tendance) → sous-titre, color → couleur
 * du badge, active → surbrillance (ring), onClick → clic.
 */
export default function StatsCard({
  title,
  value,
  subtitle,
  trend,
  color = "orange",
  onClick,
  active,
}: StatsCardProps) {
  const sub = [subtitle, trend ? `${trend.arrow} ${trend.label}` : null]
    .filter(Boolean)
    .join("  ");

  return (
    <GenericStatCard
      badgeText={title}
      badgeColor={COLOR_HEX[color]}
      value={value}
      title={sub || undefined}
      onClick={onClick}
      className={active ? "ring-2 ring-[#F17922] ring-offset-1" : ""}
    />
  );
}
