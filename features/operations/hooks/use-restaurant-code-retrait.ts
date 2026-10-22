import { useDashboardStore } from '@/store/dashboardStore';

// ⚠️ Import RELATIF entre features : `@/` pointe sur src/, `features/` est à la racine.
import { useAuthStore } from '../../users/hook/authStore';
import { restaurantPourCodeRetrait } from '../utils/code-retrait';

/**
 * Restaurant où chercher le code de retrait : celui du membre connecté s'il
 * est rattaché à un restaurant, sinon celui choisi dans Opérations
 * (voir `utils/code-retrait.ts`). Partagé par l'aperçu et la validation.
 */
export const useRestaurantCodeRetrait = (): string | undefined => {
  const restaurantDuMembre = useAuthStore((s) => s.user?.restaurant_id);
  const restaurantChoisi = useDashboardStore((s) => s.selectedRestaurantId);
  return restaurantPourCodeRetrait({ restaurant_id: restaurantDuMembre }, restaurantChoisi);
};
