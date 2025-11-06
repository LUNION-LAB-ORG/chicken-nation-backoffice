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
import TablePagination from "@/components/gestion/Marketing/app-click-list-table/table-pagination";

function AppClickListTable() {
  const {
    table,
    isLoading,
    isError,
    isFetching,
    error,
    changeFilters,
    filters,
  } = useAppClickListTable();

  const columns = marketingTableColumns;

  return (
    <div className="col-span-full px-4 bg-white min-h-64 rounded-lg flex flex-col justify-between">
      <div className="flex items-center gap-2 flex-none text-black pt-4">
        <input
          className="min-w-56 text-sm border border-gray-300 rounded-lg bg-white focus-visible:outline-none focus:outline-none py-1.5 px-2.5"
          placeholder="Entrer un mot clé"
          onChange={(e) => changeFilters({ search: e.target.value })}
          value={filters.search}
        />
      </div>
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
                        header.getContext()
                      )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {isLoading ? (
            // État de chargement initial
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                <div className="flex items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin mr-2" />
                  Chargement des données...
                </div>
              </TableCell>
            </TableRow>
          ) : isError ? (
            // État d'erreur
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                <div className="text-destructive">
                  Erreur lors du chargement des données
                  {error?.message && `: ${error.message}`}
                </div>
              </TableCell>
            </TableRow>
          ) : table.getRowModel().rows?.length ? (
            // Données chargées
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
            // Aucun résultat
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                Aucun résultat trouvé
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      <TablePagination table={table} />
    </div>
  );
}

export default AppClickListTable;
