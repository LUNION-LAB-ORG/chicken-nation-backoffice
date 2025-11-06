import {useQuery, useQueryClient, UseQueryOptions} from '@tanstack/react-query';
import {getAllAppClick} from '@/services/analytics-service';
import {
	IAppClick,
	IAppClickSearchParams,
	IPaginatedResponse
} from '../types/analytics.type';

// Clé de cache
export const appClickKeyQuery = (...params: any[]) => {
	if (params.length === 0) {
		return ['appClick'];
	}
	return ['appClick', ...params];
};

// Hook de requête principal
export function useAppClickQuery(
	params?: IAppClickSearchParams,
	options?: UseQueryOptions<IPaginatedResponse<IAppClick>, unknown>
) {
	return useQuery<IPaginatedResponse<IAppClick>>({
		queryKey: appClickKeyQuery(params),
		queryFn: async () => {
			return await getAllAppClick(params);
		},
		...options,
	});
}

// Hook pour invalider / refetch les queries liées
export const useInvalidateAppClickQuery = () => {
	const queryClient = useQueryClient();

	return async (...params: any[]) => {
		await queryClient.invalidateQueries({
			queryKey: appClickKeyQuery(...params),
			exact: false,
		});

		await queryClient.refetchQueries({
			queryKey: appClickKeyQuery(),
			type: 'active',
		});
	};
};
