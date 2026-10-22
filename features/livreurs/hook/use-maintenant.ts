'use client';

import { useEffect, useState } from 'react';

/**
 * Heure courante, relue toutes les `periodeMs` : l'état d'un livreur change
 * quand sa pause finit, même si le serveur n'a rien renvoyé de neuf.
 */
export function useMaintenant(periodeMs: number, actif = true): Date {
  const [maintenant, setMaintenant] = useState(() => new Date());

  useEffect(() => {
    if (!actif) return;
    setMaintenant(new Date());
    const id = window.setInterval(() => setMaintenant(new Date()), periodeMs);
    return () => window.clearInterval(id);
  }, [periodeMs, actif]);

  return maintenant;
}
