import { useCallback } from 'react';

import { useDashboardStore } from '@/store/dashboardStore';

import { useAuthStore } from '../../users/hook/authStore';
import { Action, Modules } from '../../users/types/auth.type';
import { ouvrirCommandeParReference } from '../utils/ouvrir-commande';

/**
 * Ouvre la page Commandes sur une référence (`ouvrirCommandeParReference`).
 * `null` sans le droit de lire les commandes : la référence reste du texte.
 */
export function useOuvrirCommande(): ((reference: string) => void) | null {
  const peutLire = useAuthStore((s) => s.can(Modules.COMMANDES, Action.READ));
  const setFilter = useDashboardStore((s) => s.setFilter);
  const setActiveTab = useDashboardStore((s) => s.setActiveTab);
  const ouvrir = useCallback(
    (reference: string) => ouvrirCommandeParReference(reference, { setFilter, setActiveTab }),
    [setFilter, setActiveTab],
  );
  return peutLire ? ouvrir : null;
}
