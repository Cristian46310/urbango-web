import type { PqrsCategory, PqrsStatus, PqrsType } from "@/core/types/pqrs";

export const statusLabels: Record<PqrsStatus, string> = {
  received: "Recibida",
  in_review: "En revisión",
  in_progress: "En proceso",
  resolved: "Resuelta",
};

const statusColors: Record<PqrsStatus, string> = {
  received: "bg-gray-100 text-gray-700",
  in_review: "bg-yellow-100 text-yellow-800",
  in_progress: "bg-blue-100 text-blue-800",
  resolved: "bg-green-100 text-green-800",
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
  other: "Otro",
};

interface PqrsStatusBadgeProps {
  status: PqrsStatus;
}

export function PqrsStatusBadge({ status }: PqrsStatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${statusColors[status]}`}
    >
      {statusLabels[status]}
    </span>
  );
}
