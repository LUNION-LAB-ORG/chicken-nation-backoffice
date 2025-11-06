import { useAppClickStatQuery } from "../queries/analytics-stats.query";

export function useAnalyticsStats() {
	// Total clicks query
	const {
		data,
		isLoading,
		isFetching,
		isError,
		error
	} = useAppClickStatQuery();

	return {
		data,
		isLoading,
		isFetching,
		isError,
		error,
	}
}