import type { PqrsCategory, PqrsStatus, PqrsType } from "@/core/types/pqrs";

export const statusLabels: Record<PqrsStatus, string> = {
  received: "Recibida",
  in_review: "En revisión",
  in_progress: "En proceso",
  resolved: "Resuelta",
};

const statusColors: Record<PqrsStatus, string> = {
  received: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200",
  in_review: "bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-200",
  in_progress: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200",
  resolved: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200",
};

export const typeLabels: Record<PqrsType, string> = {
  petition: "Petición",
  complaint: "Queja",
  claim: "Reclamo",
  suggestion: "Sugerencia",
};

export const categoryLabels: Record<PqrsCategory, string> = {
  driver: "Conductor",
  bus: "Bus",
  route: "Ruta",
  card: "Tarjeta",
  technical_support: "Soporte Técnico",
  other: "Otro",
};

interface PqrsStatusBadgeProps {
  status: PqrsStatus;
}

export function PqrsStatusBadge({ status }: PqrsStatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${statusColors[status] ?? statusColors.received}`}
    >
      {statusLabels[status] ?? status}
    </span>
  );
}
