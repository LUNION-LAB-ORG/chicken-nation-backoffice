import { useDashboardStore } from '@/store/dashboardStore';

// ⚠️ Import RELATIF entre features : `@/` pointe sur src/, `features/` est à la racine.
import { useAuthStore } from '../../users/hook/authStore';
import { restaurantPourCodeRetrait } from '../utils/code-retrait';

/**
 * Restaurant où chercher le code de retrait : celui du membre si c'est un
 * compte de restaurant, sinon celui choisi dans Opérations (voir
 * `utils/code-retrait.ts`). Partagé par l'aperçu et la validation.
 */
export const useRestaurantCodeRetrait = (): string | undefined => {
  const membre = useAuthStore((s) => s.user);
  const restaurantChoisi = useDashboardStore((s) => s.selectedRestaurantId);
  return restaurantPourCodeRetrait(membre, restaurantChoisi);
};
