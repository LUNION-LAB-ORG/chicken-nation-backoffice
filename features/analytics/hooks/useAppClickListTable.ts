import {
	MarketingTableColumn,
	marketingTableColumns
} from "@/components/gestion/Marketing/app-click-list-table/marketing-table-columns";
import React from "react";
import {getCoreRowModel, getSortedRowModel, SortingState, useReactTable,} from "@tanstack/react-table";
import {useAnalytics} from "./useAnalytics";

export function useAppClickListTable() {
	const [sorting, setSorting] = React.useState<SortingState>([]);
	const {
		data,
		filters,
		meta,
		setFilters,
		isError,
		isLoading,
		isFetching,
		changeFilters,
		error
	} = useAnalytics();

	const table = useReactTable({
		data,
		columns:marketingTableColumns,
		onSortingChange: setSorting,
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel(),
		manualPagination: true,
		pageCount: meta.totalPages,
		state: {
			sorting,
			pagination: {
				pageIndex: (filters.page || 1) - 1,
				pageSize: filters.limit || 10,
			},
		},
		onPaginationChange: (updater) => {
			const newState = typeof updater === 'function' ? updater(table.getState().pagination) : updater;
			void setFilters(prev => ({
				...prev,
				page: newState.pageIndex + 1,
				limit: newState.pageSize,
			}));
		},
	});

	return {
		table,
		isLoading,
		isFetching,
		isError,
		filters,
		changeFilters,
		error
	};
}