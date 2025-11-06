import {useQueryStates} from "nuqs";
import {analyticsFiltersClient} from "../filters/analytics.filters";
import {useMemo} from "react";
import {IAppClickSearchParams} from "../types/analytics.type";

export function useAnalyticsFilters() {
	const [filters, setFilters] = useQueryStates(analyticsFiltersClient, {
		clearOnDefault: true,
	});

	const currentSearchParams = useMemo(() => {
		const params: IAppClickSearchParams = {
			page:filters.page,
			limit: filters.limit,
			search: filters.search,
			platform: filters.platform,
			ip: filters.ip,
			dateFrom: filters.dateFrom ? filters.dateFrom.toISOString() : undefined,
			dateTo: filters.dateTo ? filters.dateTo.toISOString() : undefined,
		}
		return params;
	}, [filters]);

	const changeFilters = (newFilters: Partial<IAppClickSearchParams>) => {
		void setFilters(prevFilters => ({
			...prevFilters,
			...newFilters,
			page: newFilters.page ?? 1,
		}));
	};

	return {
		filters,
		setFilters,
		currentSearchParams,
		changeFilters,
	};
}