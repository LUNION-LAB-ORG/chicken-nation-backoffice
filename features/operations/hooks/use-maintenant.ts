"use client";

import { useEffect, useState } from "react";

/**
 * L'heure courante, relue toutes les `intervalleMs` : une retenue échue, un
 * livreur réputé parti 4 min après le retrait ou une offre expirée changent
 * l'affichage sans attendre un événement du serveur.
 */
export function useMaintenant(intervalleMs = 15_000): Date {
  const [maintenant, setMaintenant] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setMaintenant(new Date()), intervalleMs);
    return () => window.clearInterval(id);
  }, [intervalleMs]);
  return maintenant;
}
