import {useAnalyticsFilters} from "./useAnalyticsFilters";
import {useAppClickStatQuery} from "../queries/analytics-stats.query";

export function useAnalyticsStats() {
	const {
		currentSearchParams
	} = useAnalyticsFilters();

	// Total clicks query
	const {
		data: paginatedResponse,
		isLoading,
		isFetching,
		isError,
		error
	} = useAppClickStatQuery(currentSearchParams);

	// Nombre de clics en 24h
	const {
		data: clicksLast24h,
		isLoading: isLoading24h,
		isFetching: isFetching24h,
		isError: isError24h,
		error: error24h
	} = useAppClickStatQuery({
		...currentSearchParams,
		dateFrom: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
	});

	// Nombre de clics apple
	const {
		data: clicksApple,
		isLoading: isLoadingApple,
		isFetching: isFetchingApple,
		isError: isErrorApple,
		error: errorApple
	} = useAppClickStatQuery({
		...currentSearchParams,
		platform: 'apple',
	});

	// Nombre de clics android
	const {
		data: clicksAndroid,
		isLoading: isLoadingAndroid,
		isFetching: isFetchingAndroid,
		isError: isErrorAndroid,
		error: errorAndroid
	} = useAppClickStatQuery({
		...currentSearchParams,
		platform: 'android',
	});

	return {
		data: {
			totalClicks: paginatedResponse?.totalClicks || 0,
			clicksLast24h: clicksLast24h?.totalClicks || 0,
			clicksApple: clicksApple?.totalClicks || 0,
			clicksAndroid: clicksAndroid?.totalClicks || 0,
		},
		isLoading: isLoading || isLoading24h || isLoadingApple || isLoadingAndroid,
		isFetching: isFetching || isFetching24h || isFetchingApple || isFetchingAndroid,
		isError: isError || isError24h || isErrorApple || isErrorAndroid,
		error: error || error24h || errorApple || errorAndroid,
	}
}