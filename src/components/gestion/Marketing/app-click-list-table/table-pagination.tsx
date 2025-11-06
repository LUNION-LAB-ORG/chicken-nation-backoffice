import { Table } from '@tanstack/react-table';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import React from 'react';

interface DataTablePaginationProps {
	table: Table<any>;
}

const TablePagination = ({ table }: DataTablePaginationProps) => {
	return (
		<div className="flex items-center justify-end py-4 px-10">
			<div className="flex items-center gap-2 flex-none text-black">
				<button
					onClick={() => table.previousPage()}
					disabled={!table.getCanPreviousPage()}
					className="size-8 flex items-center justify-center border border-gray-300 cursor-pointer rounded-lg hover:scale-105"
				>
					<ChevronLeft className='w-4 h-4' />
				</button>
				<button
					onClick={() => table.nextPage()}
					disabled={!table.getCanNextPage()}
					className="size-8 flex items-center justify-center border border-gray-300 cursor-pointer rounded-lg hover:scale-105"
				>
					<ChevronRight className='w-4 h-4' />
				</button>
			</div>
		</div>
	);
};

export default TablePagination;