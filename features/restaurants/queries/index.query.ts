import { useQueryClient } from '@tanstack/react-query';

// 1- Clé de cache
export const restaurantKeyQuery = (...params: any[]) => {
	if (params.length === 0) {
		return ['restaurant'];
	}
	return ['restaurant', ...params];
};

// 2. Créez un hook personnalisé pour l'invalidation
export const useInvalidateRestaurantQuery = () => {
	const queryClient = useQueryClient();

	return async (...params: any[]) => {
		await queryClient.invalidateQueries({
			queryKey: restaurantKeyQuery(...params),
			exact: false
		});

		await queryClient.refetchQueries({
			queryKey: restaurantKeyQuery(),
			type: 'active'
		});
	};
};