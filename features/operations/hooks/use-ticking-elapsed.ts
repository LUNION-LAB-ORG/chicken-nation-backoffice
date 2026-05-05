"use client";

import { useEffect, useState } from "react";

/**
 * Retourne le nombre de secondes écoulées depuis `refAtISO`, ré-évalué toutes les
 * secondes pour que les badges / rings s'incrémentent en direct dans l'UI.
 *
 * Renvoie `null` si `refAtISO` est null/vide. L'intervalle est nettoyé au unmount
 * et remis à zéro dès que `refAtISO` change (nouvelle commande, changement de statut).
 */
export function useTickingElapsed(refAtISO: string | null | undefined): number | null {
  const [seconds, setSeconds] = useState<number | null>(() => computeSeconds(refAtISO));

  useEffect(() => {
    if (!refAtISO) {
      setSeconds(null);
      return;
    }
    setSeconds(computeSeconds(refAtISO));
    const id = window.setInterval(() => {
      setSeconds(computeSeconds(refAtISO));
    }, 1000);
    return () => window.clearInterval(id);
  }, [refAtISO]);

  return seconds;
}

function computeSeconds(refAtISO: string | null | undefined): number | null {
  if (!refAtISO) return null;
  const ref = new Date(refAtISO).getTime();
  if (Number.isNaN(ref)) return null;
  return Math.max(0, Math.floor((Date.now() - ref) / 1000));
}
