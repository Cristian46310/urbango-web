import type { ReactNode } from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type Column<T> = {
  key: keyof T;
  label: string;
  render?: (value: T[keyof T], item: T) => ReactNode;
};

interface CrudTableProps<T extends { id?: string }> {
  title: string;
  description: string;
  items: T[];
  columns: Array<Column<T>>;
  emptyMessage: string;
  loading?: boolean;
  error?: string | null;
  onRefresh?: () => void;
  renderActions?: (item: T) => ReactNode;
}

function formatValue(value: unknown) {
  if (value instanceof Date) {
    return value.toLocaleString();
  }

  if (value === null || value === undefined) {
    return "—";
  }

  if (typeof value === "object") {
    return JSON.stringify(value);
  }

  return String(value);
}

export function CrudTable<T extends { id?: string }>({
  title,
  description,
  items,
  columns,
  emptyMessage,
  loading,
  error,
  onRefresh,
  renderActions,
}: CrudTableProps<T>) {
  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle className="text-xl text-slate-900">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
        {onRefresh ? (
          <button
            type="button"
            onClick={onRefresh}
            className="text-sm font-medium text-slate-600 transition-colors hover:text-slate-900"
          >
            Refrescar
          </button>
        ) : null}
      </CardHeader>
      <CardContent>
        {error ? (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        {loading ? (
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-8 text-sm text-slate-600">
            Cargando registros...
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-sm text-slate-600">
            {emptyMessage}
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-slate-200">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50">
                <tr>
                  {columns.map((column) => (
                    <th
                      key={String(column.key)}
                      className="px-4 py-3 text-left font-semibold text-slate-600"
                    >
                      {column.label}
                    </th>
                  ))}
                  {renderActions ? (
                    <th className="px-4 py-3 text-left font-semibold text-slate-600">
                      Acciones
                    </th>
                  ) : null}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {items.map((item, index) => (
                  <tr key={item.id ?? index} className="align-top">
                    {columns.map((column) => {
                      const value = item[column.key];

                      return (
                        <td key={String(column.key)} className="px-4 py-3 text-slate-700">
                          {column.render ? column.render(value, item) : formatValue(value)}
                        </td>
                      );
                    })}
                    {renderActions ? (
                      <td className="px-4 py-3 text-slate-700">{renderActions(item)}</td>
                    ) : null}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}