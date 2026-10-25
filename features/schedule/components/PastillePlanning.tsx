"use client";

import React from "react";

import type { SchedulePlanStatus } from "../types/schedule.types";
import { LIBELLE_ETAT } from "../utils/actions-planning";

/** Couleurs de l'état d'un planning (celles de la liste, inchangées). */
export const COULEURS_PLANNING: Record<SchedulePlanStatus, { color: string; bg: string }> = {
  DRAFT: { color: "#92400E", bg: "#FEF3C7" },
  SENT: { color: "#1E40AF", bg: "#DBEAFE" },
  CONFIRMED: { color: "#166534", bg: "#DCFCE7" },
  ARCHIVED: { color: "#52525B", bg: "#F4F4F5" },
};

/** Pastille « BROUILLON », « ENVOYÉ », « CONFIRMÉ », « ARCHIVÉ » (majuscules, comme avant). */
export function PastillePlanning({ statut }: { statut: SchedulePlanStatus }) {
  const c = COULEURS_PLANNING[statut];
  return (
    <span
      className="shrink-0 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full whitespace-nowrap"
      style={{ color: c.color, backgroundColor: c.bg }}
    >
      {LIBELLE_ETAT[statut]}
    </span>
  );
}
