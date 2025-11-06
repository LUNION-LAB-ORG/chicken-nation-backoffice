import { useQuery } from '@tanstack/react-query';
import { appClickKeyQuery } from './index.query';
import React from 'react';
import {getAllAnalyticsAction} from "../actions/analytics.action";
import {IAppClick, IAppClickSearchParams, IPaginatedResponse} from "../types/analytics.type";
import toast from "react-hot-toast";
import getQueryClient from "@/utils/get-query-client";

const queryClient = getQueryClient();

// Option de requête
export const appClickListQueryOption = (params: IAppClickSearchParams) => {
	return {
		queryKey: appClickKeyQuery('list', params),
		queryFn: async () => {
			const result = await getAllAnalyticsAction(params);
			if (!result.success) {
				throw new Error('Erreur lors de la récupération des analytics');
			}
			return result.data as IPaginatedResponse<IAppClick>;
		},
		keepPreviousData: true,
		staleTime: 5 * 60 * 1000,
		enabled: true,
	};
};

// Hook pour récupérer la liste des analytics
export const useAppClickListQuery = (params: IAppClickSearchParams) => {
	const query = useQuery<IPaginatedResponse<IAppClick>>(appClickListQueryOption(params));

	React.useEffect(() => {
		if (query.isError || query.error) {
			toast.error(query.error?.message ?? 'Erreur réseau');
		}
	}, [query.isError, query.error]);

	return query;
};

// Hook pour précharger la liste
export const prefetchAppClickListQuery = (params: IAppClickSearchParams) => {
	return queryClient.prefetchQuery(appClickListQueryOption(params));
};
