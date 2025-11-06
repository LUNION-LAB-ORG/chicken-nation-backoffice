import {useQuery} from '@tanstack/react-query';
import {appClickKeyQuery} from './index.query';
import React from 'react';
import {getAnalyticsStatsAction} from "../actions/analytics.action";
import {IAppClick, IAppClickSearchParams, IPaginatedResponse, IStatsResponse} from "../types/analytics.type";
import toast from "react-hot-toast";
import getQueryClient from "@/utils/get-query-client";

const queryClient = getQueryClient();

// Option de requête
export const appClickStatQueryOption = (params: IAppClickSearchParams) => {
	return {
		queryKey: appClickKeyQuery('stats', params),
		queryFn: async () => {
			const result = await getAnalyticsStatsAction(params);
			if (!result.success) {
				throw new Error('Erreur lors de la récupération des stats analytics');
			}
			return result.data;
		},
		keepPreviousData: true,
		staleTime: 5 * 60 * 1000,
		enabled: true,
	};
};

// Hook pour récupérer la liste des analytics
export const useAppClickStatQuery = (params: IAppClickSearchParams) => {
	const query = useQuery<IStatsResponse>(appClickStatQueryOption(params));

	React.useEffect(() => {
		if (query.isError || query.error) {
			toast.error(query.error?.message ?? 'Erreur réseau');
		}
	}, [query.isError, query.error]);

	return query;
};

// Hook pour précharger la liste
export const prefetchAppClickListQuery = (params: IAppClickSearchParams) => {
	return queryClient.prefetchQuery(appClickStatQueryOption(params));
};
