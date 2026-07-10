"use client";
import React from "react";
import { flexRender } from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAppClickListTable } from "../../../../../features/analytics/hooks/useAppClickListTable";
import { Loader2 } from "lucide-react";
import { marketingTableColumns } from "@/components/gestion/Marketing/app-click-list-table/marketing-table-columns";
import { Pagination } from "@/components/ui/pagination";

/**
 * Journal des clics — table seule (les filtres vivent dans AnalyticsFilterBar au
 * niveau page ; on lit le même état d'URL, donc tout reste synchronisé).
 */
function AppClickListTable() {
  const { table, isLoading, isError, isFetching, error } =
    useAppClickListTable();

  const columns = marketingTableColumns;

  return (
    <div className="px-5 pb-5 pt-3 flex flex-col">
      <div className="overflow-x-auto">
        <Table className="bg-white text-black">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  <div className="flex items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin mr-2" />
                    Chargement des données...
                  </div>
                </TableCell>
              </TableRow>
            ) : isError ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  <div className="text-destructive">
                    Erreur lors du chargement des données
                    {error?.message && `: ${error.message}`}
                  </div>
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className={isFetching ? "opacity-70" : ""}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  Aucun résultat trouvé
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="pt-4">
        <Pagination
          currentPage={table.getState().pagination.pageIndex + 1}
          totalPages={table.getPageCount()}
          onPageChange={(p) => table.setPageIndex(p - 1)}
          isLoading={isFetching}
        />
      </div>
    </div>
  );
}

export default AppClickListTable;
