import { useQuery } from '@tanstack/react-query';

import { getCourseByPickupCode } from '../services/operations-service';
import { operationsKeyQuery } from './index.query';

/**
 * Preview d'une course via son pickup_code (3 chiffres).
 * Ne s'exécute que si `code.length === 3` et `enabled === true`.
 */
export const useCourseByPickupCodeQuery = (code: string, enabled = true) =>
  useQuery({
    queryKey: operationsKeyQuery('lookup', code),
    queryFn: () => getCourseByPickupCode(code),
    enabled: enabled && code.length === 3 && /^\d{3}$/.test(code),
    staleTime: 5 * 1000,
    retry: false, // 404 = code inconnu, pas la peine de retry
  });
