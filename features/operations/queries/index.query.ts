import { useQueryClient } from '@tanstack/react-query';

/**
 * Query key factory du module Opérations.
 * - `operationsKeyQuery()` → invalide tout
 * - `operationsKeyQuery('active', restaurantId)` → liste orders actives
 * - `operationsKeyQuery('lookup', pickupCode)` → preview pickup code
 */
export const operationsKeyQuery = (...params: unknown[]) => {
  if (params.length === 0) return ['operations'];
  return ['operations', ...params];
};

/**
 * Invalide à la fois le cache du module operations ET les caches liés
 * (orders + courses) car une validation pickup touche les 3 entités.
 */
export const useInvalidateOperationsQuery = () => {
  const queryClient = useQueryClient();
  return async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: operationsKeyQuery() }),
      queryClient.invalidateQueries({ queryKey: ['order'] }),
      queryClient.invalidateQueries({ queryKey: ['courses'] }),
    ]);
  };
};
