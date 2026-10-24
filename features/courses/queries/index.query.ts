import { useQueryClient } from '@tanstack/react-query';

/**
 * Query key factory + invalidation pour le module courses (backoffice).
 *
 * Usage :
 *  - `courseKeyQuery()` → `['courses']`
 *  - `courseKeyQuery('list', filters)` → `['courses', 'list', filters]`
 *  - `courseKeyQuery('detail', id)` → `['courses', 'detail', id]`
 */
export const courseKeyQuery = (...params: unknown[]) => {
  if (params.length === 0) return ['courses'] as const;
  return ['courses', ...params] as const;
};

/**
 * Invalide toutes les queries du module courses (liste + détail), et le
 * tableau de la livraison : « À traiter » et le bandeau suivent un geste
 * (affectation forcée, relance, Turbo, annulation).
 */
export const useInvalidateCourseQuery = () => {
  const queryClient = useQueryClient();
  return async () => {
    void queryClient.invalidateQueries({ queryKey: ['livraison'], exact: false });
    await queryClient.invalidateQueries({
      queryKey: courseKeyQuery(),
      exact: false,
    });
    await queryClient.refetchQueries({
      queryKey: courseKeyQuery(),
      type: 'active',
    });
  };
};
