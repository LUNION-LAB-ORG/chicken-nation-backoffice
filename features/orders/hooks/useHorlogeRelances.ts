"use client";

import { useEffect, useState } from "react";
import { useRelanceUiStore } from "../stores/relance-ui.store";

/**
 * « Maintenant » à l'heure du serveur, rafraîchi toutes les `pasMs`. Sert
 * seulement à afficher des âges (« depuis 4 min ») : l'état d'une relance
 * vient toujours du serveur, jamais de l'horloge du poste.
 */
export function useHorlogeRelances(pasMs = 10_000): number {
  const ecart = useRelanceUiStore((s) => s.ecartHorloge);
  const [local, setLocal] = useState(() => Date.now());

  useEffect(() => {
    setLocal(Date.now());
    const id = window.setInterval(() => setLocal(Date.now()), pasMs);
    return () => window.clearInterval(id);
  }, [pasMs]);

  return local + ecart;
}
