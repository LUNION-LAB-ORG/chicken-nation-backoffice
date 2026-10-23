import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';

// 1- Clé de cache
export const orderKeyQuery = (...params: any[]) => {
	if (params.length === 0) {
		return ['order'];
	}
	return ['order', ...params];
};

// 2. Créez un hook personnalisé pour l'invalidation
// Fonction stable (useCallback) : un écouteur de socket qui en dépend n'est
// pas retiré et reposé à chaque rendu (sa relecture de confirmation serait
// annulée à chaque fois, banc du 23/10).
export const useInvalidateOrderQuery = () => {
	const queryClient = useQueryClient();

	return useCallback(async (...params: any[]) => {
		await queryClient.invalidateQueries({
			queryKey: orderKeyQuery(...params),
			exact: false
		});

		await queryClient.refetchQueries({
			queryKey: orderKeyQuery(),
			type: 'active'
		});
	}, [queryClient]);
};