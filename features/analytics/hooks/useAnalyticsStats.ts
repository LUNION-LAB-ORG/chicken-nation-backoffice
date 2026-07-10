import { useAppClickStatQuery } from "../queries/analytics-stats.query";
import { IAppClickSearchParams } from "../types/analytics.type";

export function useAnalyticsStats(params: IAppClickSearchParams) {
	// Stats filtrées (mêmes filtres que la liste)
	const {
		data,
		isLoading,
		isFetching,
		isError,
		error
	} = useAppClickStatQuery(params);

	return {
		data,
		isLoading,
		isFetching,
		isError,
		error,
	}
}