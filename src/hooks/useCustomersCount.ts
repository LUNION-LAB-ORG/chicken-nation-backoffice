import { useQuery } from '@tanstack/react-query';
import { getCustomers } from '@/services/customerService';

interface UseCustomersCountParams {
  showConnectedOnly?: boolean;
  restaurantId?: string; // ✅ Ajouter restaurantId
}

export function useCustomersCount({ showConnectedOnly = false, restaurantId }: UseCustomersCountParams) {
  const { data } = useQuery({
    queryKey: ['customers-count', showConnectedOnly, restaurantId], // ✅ Ajouter restaurantId à la clé
    queryFn: () => getCustomers({
      page: 1,
      limit: 1, // On ne veut que le total, pas les données
      status: showConnectedOnly ? 'ACTIVE' : undefined,
      restaurantId // ✅ Passer restaurantId
    }),
    staleTime: 60000, // 1 minute
    select: (data) => data.meta.totalItems // Seulement le total
  });

  return data || 0;
}
