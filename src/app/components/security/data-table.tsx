"use client";

import type {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
} from "@tanstack/react-table";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useState } from "react";
import type { ReactNode } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface DataTableProps<TData> {
  columns: ColumnDef<TData, any>[];
  data: TData[];
  title: string;
  description: string;
  emptyMessage?: string;
  loading?: boolean;
  error?: string | null;
  onRefresh?: () => void;
  filterPlaceholder?: string;
  filterField?: string;
  toolbarAction?: ReactNode;
}

export function DataTable<TData>({
  columns,
  data,
  title,
  description,
  emptyMessage = "No hay registros para mostrar",
  loading = false,
  error = null,
  onRefresh,
  filterPlaceholder = "Filtrar...",
  filterField,
  toolbarAction,
}: DataTableProps<TData>) {
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [sorting, setSorting] = useState<SortingState>([]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      columnFilters,
    },
  });

  return (
    <Card className="border-(--security-border) bg-card shadow-sm">
      <CardHeader className="flex flex-col gap-4 border-b border-(--security-border) bg-(--security-surface)">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="text-xl text-(--security-foreground)">{title}</CardTitle>
            <CardDescription className="text-(--security-muted-foreground)">
              {description}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {toolbarAction}
            {onRefresh ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onRefresh}
              >
                Refrescar
              </Button>
            ) : null}
          </div>
        </div>

        {filterField ? (
          <Input
            placeholder={filterPlaceholder}
            value={
              (table.getColumn(filterField)?.getFilterValue() as string) || ""
            }
            onChange={(e) =>
              table.getColumn(filterField)?.setFilterValue(e.target.value)
            }
            className="max-w-sm"
          />
        ) : null}
      </CardHeader>

      <CardContent className="p-0">
        {error ? (
          <div className="border-t border-(--security-border) px-6 py-4">
            <div className="rounded-lg border border-red-300 bg-red-50/90 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          </div>
        ) : null}

        {loading ? (
          <div className="border-t border-(--security-border) px-6 py-8 text-center text-sm text-(--security-muted-foreground)">
            Cargando registros...
          </div>
        ) : table.getRowModel().rows.length === 0 ? (
          <div className="border-t border-(--security-border) px-6 py-8 text-center text-sm text-(--security-muted-foreground)">
            {emptyMessage}
          </div>
        ) : (
          <>
            <div className="overflow-hidden rounded-none border-t border-(--security-border)">
              <table className="min-w-full divide-y divide-(--security-border) text-sm">
                <thead className="bg-(--security-surface)">
                  {table.getHeaderGroups().map((headerGroup) => (
                    <tr key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <th
                          key={header.id}
                          className="px-6 py-3 text-left font-semibold text-(--security-muted-foreground)"
                        >
                          {header.isPlaceholder ? null : (
                            <div
                              onClick={header.column.getToggleSortingHandler()}
                              className={
                                header.column.getCanSort()
                                  ? "flex cursor-pointer select-none items-center gap-2"
                                  : "flex items-center gap-2"
                              }
                            >
                              {flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                              {header.column.getCanSort() && (
                                <span className="ml-auto">
                                  {header.column.getIsSorted() === "desc" ? (
                                    <ChevronDown className="h-4 w-4 text-(--security-muted-foreground)" />
                                  ) : header.column.getIsSorted() === "asc" ? (
                                    <ChevronUp className="h-4 w-4 text-(--security-muted-foreground)" />
                                  ) : (
                                    <span className="text-xs text-(--security-muted-foreground) opacity-0 group-hover:opacity-100">
                                      ⇅
                                    </span>
                                  )}
                                </span>
                              )}
                            </div>
                          )}
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody className="divide-y divide-(--security-border) bg-card">
                  {table.getRowModel().rows.map((row) => (
                    <tr
                      key={row.id}
                      className="align-top transition-colors hover:bg-(--security-surface)"
                    >
                      {row.getVisibleCells().map((cell) => (
                        <td
                          key={cell.id}
                          className="px-6 py-4 text-(--security-foreground)"
                        >
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center gap-2 border-t border-(--security-border) px-6 py-4">
              <Button
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                variant="outline"
                size="sm"
              >
                Anterior
              </Button>
              <div className="flex-1 text-center text-sm text-(--security-muted-foreground)">
                Página {table.getState().pagination.pageIndex + 1} de{" "}
                {table.getPageCount() || 1}
              </div>
              <Button
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                variant="outline"
                size="sm"
              >
                Siguiente
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
