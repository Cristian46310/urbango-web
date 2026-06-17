import { useState } from "react";
import { CalendarClock } from "lucide-react";

import type { CreateAppointmentRequest } from "@/core/types/appointments";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AvailabilitySlots } from "./AvailabilitySlots";
import type { Slot } from "@/core/types/appointments";

interface AppointmentFormProps {
  slots: Slot[];
  slotsLoading: boolean;
  creating: boolean;
  userId: string;
  userEmail: string;
  onLoadSlots: () => void;
  onSubmit: (payload: CreateAppointmentRequest) => Promise<unknown>;
}

export function AppointmentForm({
  slots,
  slotsLoading,
  creating,
  userId,
  userEmail,
  onLoadSlots,
  onSubmit,
}: AppointmentFormProps) {
  const [open, setOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [type, setType] = useState<"virtual" | "in_person">("virtual");
  const [reason, setReason] = useState<"credit_card" | "complaint" | "refund" | "other">("complaint");
  const [description, setDescription] = useState("");

  const handleOpen = (value: boolean) => {
    setOpen(value);
    if (value) {
      onLoadSlots();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlot) return;
    const result = await onSubmit({
      type,
      reason,
      date_time: selectedSlot,
      description,
      user_id: userId,
      user_email: userEmail,
    });
    if (result) {
      setOpen(false);
      setSelectedSlot(null);
      setDescription("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        <Button type="button" size="sm">
          <CalendarClock className="mr-2 size-4" />
          Agendar cita
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Agendar cita de reclamo</DialogTitle>
          <DialogDescription>
            Selecciona un horario disponible y el motivo de tu cita.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={(e) => { void handleSubmit(e); }} className="space-y-4">
          <div className="space-y-2">
            <Label>Tipo de atención</Label>
            <Select value={type} onValueChange={(v) => { setType(v as typeof type); }}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="virtual">Virtual</SelectItem>
                <SelectItem value="in_person">Presencial</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Motivo</Label>
            <Select value={reason} onValueChange={(v) => { setReason(v as typeof reason); }}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="credit_card">Tarjeta de crédito</SelectItem>
                <SelectItem value="complaint">Queja</SelectItem>
                <SelectItem value="refund">Reembolso</SelectItem>
                <SelectItem value="other">Otro</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Descripción (opcional)</Label>
            <Textarea
              value={description}
              onChange={(e) => { setDescription(e.target.value); }}
              placeholder="Describe brevemente el motivo de tu cita..."
              maxLength={300}
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label>Selecciona un horario</Label>
            <AvailabilitySlots
              slots={slots}
              selected={selectedSlot}
              onSelect={setSelectedSlot}
              loading={slotsLoading}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => { setOpen(false); }}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={!selectedSlot || creating}>
              {creating ? "Agendando..." : "Confirmar cita"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
