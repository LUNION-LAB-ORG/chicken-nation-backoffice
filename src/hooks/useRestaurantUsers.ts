import { useQuery } from '@tanstack/react-query';
import { getRestaurantUsers, RestaurantUser } from '@/services/restaurantService';

// ✅ Hook pour récupérer les utilisateurs d'un restaurant
export const useRestaurantUsers = (restaurantId: string | null | undefined, enabled = true) => {
    return useQuery({
        queryKey: ['restaurant-users', restaurantId],
        queryFn: () => getRestaurantUsers(restaurantId!),
        enabled: enabled && !!restaurantId,
        staleTime: 5 * 60 * 1000, // 5 minutes
        refetchInterval: 10 * 60 * 1000, // Refetch toutes les 10 minutes
    });
};

// ✅ Hook pour récupérer les utilisateurs du restaurant de l'utilisateur connecté
export const useCurrentRestaurantUsers = (currentUser: { restaurant_id?: string | null } | null, enabled = true) => {
    const restaurantId = currentUser?.restaurant_id;

    return useRestaurantUsers(restaurantId, enabled && !!restaurantId);
};