import { useQuery } from '@tanstack/react-query';

import { useRestaurantCodeRetrait } from '../hooks/use-restaurant-code-retrait';
import { getCourseByPickupCode } from '../services/operations-service';
import { operationsKeyQuery } from './index.query';

/**
 * Preview d'une course via son pickup_code (3 chiffres), dans le restaurant
 * du membre connecté ou celui choisi dans Opérations (incident du 22/10 :
 * le même code peut exister dans un autre restaurant).
 * Ne s'exécute que si `code.length === 3` et `enabled === true`.
 * Le restaurant fait partie de la clé : changer de restaurant après « Ce code
 * existe dans plusieurs restaurants » relance la recherche.
 */
export const useCourseByPickupCodeQuery = (code: string, enabled = true) => {
  const restaurantId = useRestaurantCodeRetrait();
  return useQuery({
    queryKey: operationsKeyQuery('lookup', code, restaurantId ?? null),
    queryFn: () => getCourseByPickupCode(code, restaurantId),
    enabled: enabled && code.length === 3 && /^\d{3}$/.test(code),
    staleTime: 5 * 1000,
    retry: false, // 404 = code inconnu, pas la peine de retry
  });
};
