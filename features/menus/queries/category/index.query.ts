import { useQueryClient } from '@tanstack/react-query';

// 1- Clé de cache
export const categoryKeyQuery = (...params: any[]) => {
	if (params.length === 0) {
		return ['category'];
	}
	return ['category', ...params];
};

// 2. Créez un hook personnalisé pour l'invalidation
export const useInvalidateCategoryQuery = () => {
	const queryClient = useQueryClient();

	return async (...params: any[]) => {
		await queryClient.invalidateQueries({
			queryKey: categoryKeyQuery(...params),
			exact: false
		});

		await queryClient.refetchQueries({
			queryKey: categoryKeyQuery(),
			type: 'active'
		});
	};
};