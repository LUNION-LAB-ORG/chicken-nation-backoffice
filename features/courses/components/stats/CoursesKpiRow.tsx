"use client";

import React from "react";
import { Activity, CheckCircle2, ListOrdered, Wallet } from "lucide-react";

import type { ICourseStats } from "../../types/course.types";
import { CoursesStatCard } from "./CoursesStatCard";

interface Props {
  stats?: ICourseStats;
  isLoading: boolean;
}

function formatFcfa(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return n.toLocaleString("fr-FR");
}

/**
 * Ligne de 4 KPI cards pour la page Courses :
 *  - Total courses (période)
 *  - Courses en cours (active)
 *  - Taux de succès (COMPLETED / terminales)
 *  - Revenu livraison cumulé
 */
export function CoursesKpiRow({ stats, isLoading }: Props) {
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

  const t = stats?.totals;
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <CoursesStatCard
        badgeText="Total courses"
        badgeColor="#F17922"
        icon={ListOrdered}
        iconColor="#F17922"
        value={t?.total ?? 0}
        subtitle={`${t?.pendingAssignment ?? 0} en attente d'assignation`}
      />
      <CoursesStatCard
        badgeText="En cours"
        badgeColor="#007AFF"
        icon={Activity}
        iconColor="#007AFF"
        value={t?.active ?? 0}
        subtitle="ACCEPTED · AT_RESTAURANT · IN_DELIVERY"
      />
      <CoursesStatCard
        badgeText="Taux de succès"
        badgeColor="#4FCB71"
        icon={CheckCircle2}
        iconColor="#4FCB71"
        value={`${stats?.successRate ?? 0}%`}
        subtitle={`${t?.completed ?? 0} livrées · ${(t?.cancelled ?? 0) + (t?.expired ?? 0)} échouées`}
        progress={stats?.successRate ?? 0}
        progressLabel="Sur courses terminées"
      />
      <CoursesStatCard
        badgeText="Revenu livraison"
        badgeColor="#EA4335"
        icon={Wallet}
        iconColor="#EA4335"
        value={stats ? formatFcfa(stats.totalRevenue) : "0"}
        unit="F"
        subtitle={stats ? `Durée moyenne : ${stats.avgDurationMin} min` : undefined}
      />
    </div>
  );
}
