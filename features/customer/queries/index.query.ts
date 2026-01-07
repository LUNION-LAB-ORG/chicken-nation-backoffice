import { useQueryClient } from '@tanstack/react-query';

// 1- Clé de cache
export const customerKeyQuery = (...params: unknown[]) => {
	if (params.length === 0) {
		return ['customer'];
	}
	return ['customer', ...params];
};

// 2. Créez un hook personnalisé pour l'invalidation
export const useInvalidateCustomerQuery = () => {
	const queryClient = useQueryClient();

	return async (...params: unknown[]) => {
		await queryClient.invalidateQueries({
			queryKey: customerKeyQuery(...params),
			exact: false
		});

		await queryClient.refetchQueries({
			queryKey: customerKeyQuery(),
			type: 'active'
		});
	};
};