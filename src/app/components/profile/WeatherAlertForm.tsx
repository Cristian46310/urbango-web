import { useEffect, useState } from "react";
import { CloudSun } from "lucide-react";

import type {
  CreateWeatherAlertRequest,
  NotificationChannel,
  UpdateWeatherAlertRequest,
  WeatherAlert,
} from "@/core/types/weather";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface WeatherAlertFormProps {
  userId: string;
  userEmail: string;
  saving: boolean;
  editTarget?: WeatherAlert | null;
  onCreateSubmit: (payload: CreateWeatherAlertRequest) => Promise<WeatherAlert | null>;
  onUpdateSubmit: (alertId: string, payload: UpdateWeatherAlertRequest) => Promise<boolean>;
  onEditClear?: () => void;
}

export function WeatherAlertForm({
  userId,
  userEmail,
  saving,
  editTarget,
  onCreateSubmit,
  onUpdateSubmit,
  onEditClear,
}: WeatherAlertFormProps) {
  const [open, setOpen] = useState(false);
  const [travelHour, setTravelHour] = useState(7);
  const [cityName, setCityName] = useState("");
  const [channel, setChannel] = useState<NotificationChannel>("email");

  const isEdit = Boolean(editTarget);

  useEffect(() => {
    if (editTarget) {
      setTravelHour(editTarget.travel_hour);
      setCityName(editTarget.city_name);
      setChannel(editTarget.preferred_channel);
      setOpen(true);
    }
  }, [editTarget]);

  const handleClose = (val: boolean) => {
    setOpen(val);
    if (!val && onEditClear) onEditClear();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isEdit && editTarget) {
      const ok = await onUpdateSubmit(editTarget.id, {
        user_email: userEmail,
        travel_hour: travelHour,
        city_name: cityName,
        preferred_channel: channel,
      });
      if (ok) setOpen(false);
    } else {
      const result = await onCreateSubmit({
        user_id: userId,
        user_email: userEmail,
        travel_hour: travelHour,
        city_name: cityName,
        preferred_channel: channel,
      });
      if (result) {
        setOpen(false);
        setCityName("");
        setTravelHour(7);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      {!isEdit && (
        <DialogTrigger asChild>
          <Button type="button" size="sm">
            <CloudSun className="mr-2 size-4" />
            Nueva preferencia de clima
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Editar preferencia de clima" : "Nueva preferencia de clima"}
          </DialogTitle>
          <DialogDescription>
            Recibirás alertas cuando el clima no sea favorable para tu horario habitual de viaje.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={(e) => { void handleSubmit(e); }} className="space-y-4">
          <div className="space-y-2">
            <Label>Ciudad</Label>
            <Input
              value={cityName}
              onChange={(e) => { setCityName(e.target.value); }}
              placeholder="Ej. Manizales,CO"
              required
            />
            <p className="text-xs text-muted-foreground">
              Usa el formato Ciudad,CodigoPais (ej. Bogota,CO)
            </p>
          </div>
          <div className="space-y-2">
            <Label>Hora habitual de viaje (0–23)</Label>
            <Input
              type="number"
              min={0}
              max={23}
              value={travelHour}
              onChange={(e) => { setTravelHour(Number(e.target.value)); }}
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Canal de notificación preferido</Label>
            <Select value={channel} onValueChange={(v) => { setChannel(v as NotificationChannel); }}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="email">Correo electrónico</SelectItem>
                <SelectItem value="whatsapp">WhatsApp</SelectItem>
                <SelectItem value="push">Notificación push</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => { handleClose(false); }}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Guardando..." : isEdit ? "Guardar cambios" : "Crear preferencia"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
