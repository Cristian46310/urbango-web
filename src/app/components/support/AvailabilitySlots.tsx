import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarClock } from "lucide-react";

import type { Slot } from "@/core/types/appointments";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AvailabilitySlotsProps {
  slots: Slot[];
  selected: string | null;
  onSelect: (datetime: string) => void;
  loading?: boolean;
}

function formatSlot(start: string) {
  try {
    const date = new Date(start);
    return {
      date: format(date, "EEEE d 'de' MMMM", { locale: es }),
      time: format(date, "HH:mm", { locale: es }),
    };
  } catch {
    return { date: start, time: "" };
  }
}

export function AvailabilitySlots({
  slots,
  selected,
  onSelect,
  loading,
}: AvailabilitySlotsProps) {
  if (loading) {
    return (
      <p className="py-4 text-center text-sm text-muted-foreground">
        Cargando disponibilidad...
      </p>
    );
  }

  if (slots.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-6 text-center text-sm text-muted-foreground">
        <CalendarClock className="size-8 opacity-50" />
        <p>No hay horarios disponibles en este momento.</p>
      </div>
    );
  }

  const grouped: Record<string, Slot[]> = {};
  for (const slot of slots) {
    const { date } = formatSlot(slot.start);
    if (!grouped[date]) grouped[date] = [];
    grouped[date].push(slot);
  }

  return (
    <div className="space-y-4 max-h-72 overflow-y-auto pr-1">
      {Object.entries(grouped).map(([date, daySlots]) => (
        <div key={date}>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {date}
          </p>
          <div className="flex flex-wrap gap-2">
            {daySlots.map((slot) => {
              const { time } = formatSlot(slot.start);
              const isSelected = selected === slot.start;
              return (
                <Button
                  key={slot.start}
                  type="button"
                  size="sm"
                  variant={isSelected ? "default" : "outline"}
                  className={cn("min-w-[68px]", isSelected && "ring-2 ring-primary")}
                  onClick={() => { onSelect(slot.start); }}
                >
                  {time}
                </Button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
