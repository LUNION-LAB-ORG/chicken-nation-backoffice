import getQueryClient from "@/utils/get-query-client";
import { useQuery } from '@tanstack/react-query';
import React from 'react';
import toast from "react-hot-toast";
import { getAnalyticsStatsAction } from "../actions/analytics.action";
import { IAppClickSearchParams, IStatsResponse } from "../types/analytics.type";
import { appClickKeyQuery } from './index.query';

const queryClient = getQueryClient();

// Option de requête
export const appClickStatQueryOption = () => {
	return {
		queryKey: appClickKeyQuery('stats'),
		queryFn: async () => {
			const result = await getAnalyticsStatsAction();
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
export const useAppClickStatQuery = () => {
	const query = useQuery<IStatsResponse>(appClickStatQueryOption());

	React.useEffect(() => {
		if (query.isError || query.error) {
			toast.error(query.error?.message ?? 'Erreur réseau');
		}
	}, [query.isError, query.error]);

	return query;
};

// Hook pour précharger la liste
export const prefetchAppClickListQuery = () => {
	return queryClient.prefetchQuery(appClickStatQueryOption());
};
