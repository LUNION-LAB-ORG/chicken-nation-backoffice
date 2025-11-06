import {useAppClickListQuery} from "../queries/analytics-list.query";
import {useAnalyticsFilters} from "./useAnalyticsFilters";

export const useAnalytics = () => {
	const {
		currentSearchParams,
		setFilters,
		filters,
		changeFilters
	} = useAnalyticsFilters();

	const {
		data: paginatedResponse,
		isLoading,
		isFetching,
		isError,
		error
	} = useAppClickListQuery(currentSearchParams);

	return {
		isLoading,
		isFetching,
		isError,
		error,
		filters,
		changeFilters,
		setFilters,
		data: paginatedResponse?.data || [],
		meta: {
			total: paginatedResponse?.totalCount,
			page: paginatedResponse?.page,
			limit: paginatedResponse?.limit,
			totalPages: paginatedResponse?.totalPages
		}
	}
}