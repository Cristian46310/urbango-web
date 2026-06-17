import type { AppointmentReason, AppointmentType } from "@/core/types/appointments";

const typeLabels: Record<AppointmentType, string> = {
  virtual: "Virtual",
  in_person: "Presencial",
};

const typeColors: Record<AppointmentType, string> = {
  virtual: "bg-blue-100 text-blue-800",
  in_person: "bg-green-100 text-green-800",
};

const reasonLabels: Record<AppointmentReason, string> = {
  credit_card: "Tarjeta de crédito",
  complaint: "Queja",
  refund: "Reembolso",
  other: "Otro",
};

interface AppointmentTypeBadgeProps {
  type: AppointmentType;
}

export function AppointmentTypeBadge({ type }: AppointmentTypeBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${typeColors[type]}`}
    >
      {typeLabels[type]}
    </span>
  );
}

interface AppointmentReasonBadgeProps {
  reason: AppointmentReason;
}

export function AppointmentReasonBadge({ reason }: AppointmentReasonBadgeProps) {
  return (
    <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
      {reasonLabels[reason]}
    </span>
  );
}

export { typeLabels, reasonLabels };
