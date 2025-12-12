import { useQueryClient } from '@tanstack/react-query';

// 1- Clé de cache
export const dishKeyQuery = (...params: any[]) => {
	if (params.length === 0) {
		return ['dish'];
	}
	return ['dish', ...params];
};

// 2. Créez un hook personnalisé pour l'invalidation
export const useInvalidateDishQuery = () => {
	const queryClient = useQueryClient();

	return async (...params: any[]) => {
		await queryClient.invalidateQueries({
			queryKey: dishKeyQuery(...params),
			exact: false
		});

		await queryClient.refetchQueries({
			queryKey: dishKeyQuery(),
			type: 'active'
		});
	};
};