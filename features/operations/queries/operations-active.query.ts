import { useQuery } from '@tanstack/react-query';
import React from 'react';
import { toast } from 'react-hot-toast';

import { getActiveOperationsOrders } from '../services/operations-service';
import { operationsKeyQuery } from './index.query';

/**
 * Liste des commandes actives pour la page Opérations.
 * Temps réel via `useOperationsSocketSync` (invalide cette query à chaque event pertinent).
 */
export const useOperationsActiveQuery = (restaurantId?: string) => {
  const result = useQuery({
    queryKey: operationsKeyQuery('active', restaurantId),
    queryFn: () => getActiveOperationsOrders(restaurantId),
    staleTime: 10 * 1000,
    refetchOnWindowFocus: true,
  });

  React.useEffect(() => {
    if (result.isError || result.error) {
      toast.error(result.error?.message ?? 'Erreur lors du chargement des opérations');
    }
  }, [result.isError, result.error]);

  return result;
};
