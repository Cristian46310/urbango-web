import type { ReactNode } from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface Column<T> {
  key: keyof T;
  label: string;
  render?: (value: T[keyof T], item: T) => ReactNode;
}

interface CrudTableProps<T extends { id?: string }> {
  title: string;
  description: string;
  items: T[];
  columns: Column<T>[];
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
    <Card className="border-(--security-border) bg-card shadow-sm">
      <CardHeader className="flex flex-row items-start justify-between gap-4 border-b border-(--security-border) bg-(--security-surface)">
        <div>
          <CardTitle className="text-xl text-(--security-foreground)">{title}</CardTitle>
          <CardDescription className="text-(--security-muted-foreground)">{description}</CardDescription>
        </div>
        {onRefresh ? (
          <button
            type="button"
            onClick={onRefresh}
            className="text-sm font-medium text-(--security-muted-foreground) transition-colors hover:text-(--security-foreground)"
          >
            Refrescar
          </button>
        ) : null}
      </CardHeader>
      <CardContent>
        {error ? (
          <div className="mb-4 rounded-lg border border-red-300 bg-red-50/90 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        {loading ? (
          <div className="rounded-lg border border-(--security-border) bg-(--security-surface) px-4 py-8 text-sm text-(--security-muted-foreground)">
            Cargando registros...
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-lg border border-dashed border-(--security-border) bg-(--security-surface) px-4 py-8 text-sm text-(--security-muted-foreground)">
            {emptyMessage}
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-(--security-border)">
            <table className="min-w-full divide-y divide-(--security-border) text-sm">
              <thead className="bg-(--security-surface)">
                <tr>
                  {columns.map((column) => (
                    <th
                      key={String(column.key)}
                      className="px-4 py-3 text-left font-semibold text-(--security-muted-foreground)"
                    >
                      {column.label}
                    </th>
                  ))}
                  {renderActions ? (
                    <th className="px-4 py-3 text-left font-semibold text-(--security-muted-foreground)">
                      Acciones
                    </th>
                  ) : null}
                </tr>
              </thead>
              <tbody className="divide-y divide-(--security-border) bg-card">
                {items.map((item, index) => (
                  <tr key={item.id ?? index} className="align-top transition-colors hover:bg-(--security-surface)">
                    {columns.map((column) => {
                      const value = item[column.key];

                      return (
                        <td key={String(column.key)} className="px-4 py-3 text-(--security-foreground)">
                          {column.render ? column.render(value, item) : formatValue(value)}
                        </td>
                      );
                    })}
                    {renderActions ? (
                      <td className="px-4 py-3 text-(--security-foreground)">{renderActions(item)}</td>
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