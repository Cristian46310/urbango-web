import { useEffect, useState } from "react";

import type { Appointment, UpdateAppointmentRequest } from "@/core/types/appointments";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { Input } from "@/components/ui/input";

interface AppointmentEditDialogProps {
  appointment: Appointment | null;
  open: boolean;
  saving: boolean;
  onClose: () => void;
  onSave: (id: string, payload: UpdateAppointmentRequest) => Promise<boolean>;
}

export function AppointmentEditDialog({
  appointment,
  open,
  saving,
  onClose,
  onSave,
}: AppointmentEditDialogProps) {
  const [type, setType] = useState<"virtual" | "in_person">("virtual");
  const [reason, setReason] = useState<"credit_card" | "complaint" | "refund" | "other">("complaint");
  const [description, setDescription] = useState("");
  const [dateTime, setDateTime] = useState("");

  useEffect(() => {
    if (appointment) {
      setType(appointment.type);
      setReason(appointment.reason);
      setDescription(appointment.description ?? "");
      setDateTime(appointment.date_time ? appointment.date_time.slice(0, 16) : "");
    }
  }, [appointment]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appointment) return;
    const ok = await onSave(appointment.id, {
      type,
      reason,
      description,
      date_time: dateTime ? new Date(dateTime).toISOString() : null,
    });
    if (ok) onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Editar cita</DialogTitle>
          <DialogDescription>Modifica los datos de la cita.</DialogDescription>
        </DialogHeader>
        <form onSubmit={(e) => { void handleSave(e); }} className="space-y-4">
          <div className="space-y-2">
            <Label>Tipo de atención</Label>
            <Select value={type} onValueChange={(v) => { setType(v as typeof type); }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="virtual">Virtual</SelectItem>
                <SelectItem value="in_person">Presencial</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Motivo</Label>
            <Select value={reason} onValueChange={(v) => { setReason(v as typeof reason); }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="credit_card">Tarjeta de crédito</SelectItem>
                <SelectItem value="complaint">Queja</SelectItem>
                <SelectItem value="refund">Reembolso</SelectItem>
                <SelectItem value="other">Otro</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Fecha y hora</Label>
            <Input
              type="datetime-local"
              value={dateTime}
              onChange={(e) => { setDateTime(e.target.value); }}
            />
          </div>
          <div className="space-y-2">
            <Label>Descripción</Label>
            <Textarea
              value={description}
              onChange={(e) => { setDescription(e.target.value); }}
              maxLength={300}
              rows={2}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Guardando..." : "Guardar cambios"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
