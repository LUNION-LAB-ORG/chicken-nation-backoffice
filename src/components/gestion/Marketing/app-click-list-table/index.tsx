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
import { DEEPLINK_TYPE_ORDER, deeplinkTypeMeta } from "@/components/gestion/Marketing/deeplink-types";

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
    <div className="px-5 pb-5 pt-3 flex flex-col">
      <div className="flex flex-wrap items-center gap-2 flex-none text-black py-3">
        <input
          className="min-w-56 text-sm border border-gray-300 rounded-lg bg-white focus-visible:outline-none focus:outline-none py-1.5 px-2.5"
          placeholder="Rechercher (plateforme, IP, cible…)"
          onChange={(e) => changeFilters({ search: e.target.value })}
          value={filters.search}
        />
        <select
          className="text-sm border border-gray-300 rounded-lg bg-white py-1.5 px-2.5 focus:outline-none"
          value={filters.type ?? ""}
          onChange={(e) => changeFilters({ type: e.target.value })}
        >
          <option value="">Tous les types</option>
          {DEEPLINK_TYPE_ORDER.map((t) => (
            <option key={t} value={t}>
              {deeplinkTypeMeta(t).label}
            </option>
          ))}
        </select>
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
