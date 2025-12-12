import { useQueryClient } from '@tanstack/react-query';

// 1- Clé de cache
export const orderKeyQuery = (...params: any[]) => {
	if (params.length === 0) {
		return ['order'];
	}
	return ['order', ...params];
};

// 2. Créez un hook personnalisé pour l'invalidation
export const useInvalidateOrderQuery = () => {
	const queryClient = useQueryClient();

	return async (...params: any[]) => {
		await queryClient.invalidateQueries({
			queryKey: orderKeyQuery(...params),
			exact: false
		});

		await queryClient.refetchQueries({
			queryKey: orderKeyQuery(),
			type: 'active'
		});
	};
};