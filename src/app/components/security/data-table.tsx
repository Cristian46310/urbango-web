"use client";

import type {
  ColumnDef,
  ColumnFiltersState,
  PaginationState,
  SortingState,
} from "@tanstack/react-table";
import {
  functionalUpdate,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useState } from "react";
import type { ReactNode } from "react";
import { ChevronDown, ChevronUp, Inbox, RefreshCw } from "lucide-react";

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
  // TanStack infers a different TValue per accessor column; `any` keeps compatibility across mixed columns.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  columns: ColumnDef<TData, any>[];
  data: TData[];
  title: string;
  description: string;
  emptyMessage?: string;
  /** Semantic empty-state icon; defaults to Inbox. */
  emptyIcon?: ReactNode;
  loading?: boolean;
  error?: string | null;
  onRefresh?: () => void;
  /** When false, hides the built-in refresh control (use an external one). */
  showRefresh?: boolean;
  refreshLabel?: string;
  filterPlaceholder?: string;
  filterField?: string;
  toolbarAction?: ReactNode;
  headerExtra?: ReactNode;
  pageIndex?: number;
  pageSize?: number;
  pageCount?: number;
  totalItems?: number;
  onPageChange?: (page: number) => void;
}

export function DataTable<TData>({
  columns,
  data,
  title,
  description,
  emptyMessage = "No hay registros para mostrar",
  emptyIcon,
  loading = false,
  error = null,
  onRefresh,
  showRefresh = true,
  refreshLabel,
  filterPlaceholder = "Filtrar...",
  filterField,
  toolbarAction,
  headerExtra,
  pageIndex,
  pageSize = 10,
  pageCount,
  totalItems,
  onPageChange,
}: DataTableProps<TData>) {
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [localPagination, setLocalPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize,
  });

  const isServerPagination = typeof onPageChange === "function";
  const paginationState: PaginationState = isServerPagination
    ? {
      pageIndex: pageIndex ?? 0,
      pageSize,
    }
    : localPagination;

  // TanStack Table exposes non-memoizable functions; keep this scoped suppression local.
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: isServerPagination ? undefined : getPaginationRowModel(),
    manualPagination: isServerPagination,
    pageCount: isServerPagination ? (pageCount ?? 1) : undefined,
    onPaginationChange: isServerPagination
      ? (updater) => {
        const next = functionalUpdate(updater, paginationState);
        if (next.pageIndex !== paginationState.pageIndex) {
          onPageChange(next.pageIndex);
        }
      }
      : setLocalPagination,
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      columnFilters,
      pagination: paginationState,
    },
  });

  return (
    <Card className="overflow-hidden border-(--security-border) bg-white shadow-sm">
      <CardHeader className="space-y-4 bg-white pb-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 space-y-1">
            <CardTitle className="text-xl text-black">{title}</CardTitle>
            <CardDescription className="text-black/80">
              {description}
            </CardDescription>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {toolbarAction}
            {onRefresh && showRefresh ? (
              <Button
                type="button"
                variant="outline"
                size={refreshLabel ? "sm" : "icon"}
                className={refreshLabel ? undefined : "size-8"}
                onClick={onRefresh}
                aria-label="Refrescar"
                title="Refrescar"
              >
                <RefreshCw className="size-3.5" />
                {refreshLabel ? <span>{refreshLabel}</span> : null}
              </Button>
            ) : null}
          </div>
        </div>

        {headerExtra}

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

      <CardContent className="border-t border-(--security-border) bg-white p-0">
        {error ? (
          <div className="px-6 py-5">
            <div className="rounded-lg border border-red-300 bg-red-50/90 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          </div>
        ) : null}

        {loading ? (
          <div className="flex min-h-[160px] items-center justify-center px-6 py-8 text-center text-sm text-slate-400">
            Cargando registros...
          </div>
        ) : table.getRowModel().rows.length === 0 ? (
          <div className="flex min-h-[160px] flex-col items-center justify-center gap-3 px-6 py-8 text-center">
            {emptyIcon ?? (
              <Inbox
                className="size-11 text-slate-300"
                strokeWidth={1.5}
                aria-hidden
              />
            )}
            <p className="text-base text-slate-400">{emptyMessage}</p>
          </div>
        ) : (
          <>
            <div className="overflow-hidden">
              <table className="min-w-full divide-y divide-(--security-border) text-sm">
                <thead className="bg-[linear-gradient(140deg,var(--security-hero-start)_0%,var(--security-hero-end)_100%)]">
                  {table.getHeaderGroups().map((headerGroup) => (
                    <tr key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <th
                          key={header.id}
                          className="px-6 py-3 text-left font-semibold text-white/95"
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
                                header.getContext(),
                              )}
                              {header.column.getCanSort() && (
                                <span className="ml-auto">
                                  {header.column.getIsSorted() === "desc" ? (
                                    <ChevronDown className="h-4 w-4 text-white/90" />
                                  ) : header.column.getIsSorted() === "asc" ? (
                                    <ChevronUp className="h-4 w-4 text-white/90" />
                                  ) : (
                                    <span className="text-xs text-white/70 opacity-0 group-hover:opacity-100">
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
                <tbody className="divide-y divide-(--security-border) bg-white">
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
                            cell.getContext(),
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
                onClick={() => {
                  if (isServerPagination) {
                    onPageChange(Math.max(0, paginationState.pageIndex - 1));
                    return;
                  }

                  table.previousPage();
                }}
                disabled={isServerPagination ? paginationState.pageIndex <= 0 : !table.getCanPreviousPage()}
                variant="outline"
                size="sm"
              >
                Anterior
              </Button>
              <div className="flex-1 text-center text-sm text-(--security-muted-foreground)">
                Pagina {paginationState.pageIndex + 1} de {isServerPagination ? (pageCount ?? 1) : Math.max(1, table.getPageCount())}
                {typeof totalItems === "number" ? ` (${String(totalItems)} registros)` : ""}
              </div>
              <Button
                onClick={() => {
                  if (isServerPagination) {
                    onPageChange(paginationState.pageIndex + 1);
                    return;
                  }

                  table.nextPage();
                }}
                disabled={
                  isServerPagination
                    ? paginationState.pageIndex + 1 >= (pageCount ?? 1)
                    : !table.getCanNextPage()
                }
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
