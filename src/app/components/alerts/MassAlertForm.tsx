import { useMemo, useState } from "react";
import { CalendarClock, Send, Users } from "lucide-react";

import type { AlertScope, MassAlertPayload } from "@/core/types/alerts";
import type { RouteListItem } from "@/services/routeService";
import { DialogField } from "@/app/components/security/dialog-field";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { showWarningToast } from "@/lib/toast";

interface MassAlertFormProps {
  routes: RouteListItem[];
  routesLoading: boolean;
  previewLoading: boolean;
  sending: boolean;
  previewCount: number | null;
  onPreview: (payload: MassAlertPayload) => Promise<number | null>;
  onSend: (payload: MassAlertPayload) => Promise<unknown>;
  onClearPreview: () => void;
}

function parseZoneNames(raw: string): string[] {
  return raw
    .split(/[\n,;]+/)
    .map((value) => value.trim())
    .filter(Boolean);
}

function toLocalDatetimeValue(date: Date) {
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60_000);
  return local.toISOString().slice(0, 16);
}

export function MassAlertForm({
  routes,
  routesLoading,
  previewLoading,
  sending,
  previewCount,
  onPreview,
  onSend,
  onClearPreview,
}: MassAlertFormProps) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [scope, setScope] = useState<AlertScope>("all");
  const [selectedRouteIds, setSelectedRouteIds] = useState<string[]>([]);
  const [zoneNamesRaw, setZoneNamesRaw] = useState("");
  const [isUrgent, setIsUrgent] = useState(false);
  const [scheduleEnabled, setScheduleEnabled] = useState(false);
  const [scheduledAtLocal, setScheduledAtLocal] = useState(() => toLocalDatetimeValue(new Date()));
  const [confirmOpen, setConfirmOpen] = useState(false);

  const zoneNames = useMemo(() => parseZoneNames(zoneNamesRaw), [zoneNamesRaw]);

  const payload = useMemo((): MassAlertPayload | null => {
    if (!title.trim() || !body.trim()) return null;

    const base: MassAlertPayload = {
      title: title.trim(),
      body: body.trim(),
      scope,
      isUrgent,
    };

    if (scope === "route") {
      if (selectedRouteIds.length === 0) return null;
      base.routeIds = selectedRouteIds;
    }

    if (scope === "zone") {
      if (zoneNames.length === 0) return null;
      base.zoneNames = zoneNames;
    }

    if (scheduleEnabled && scheduledAtLocal) {
      base.scheduledAt = new Date(scheduledAtLocal).toISOString();
      base.isUrgent = false;
    }

    return base;
  }, [
    title,
    body,
    scope,
    isUrgent,
    selectedRouteIds,
    zoneNames,
    scheduleEnabled,
    scheduledAtLocal,
  ]);

  const canPreview = Boolean(payload);
  const canSend = Boolean(payload) && !sending && !previewLoading;

  const handleSendClick = async () => {
    if (!payload) return;

    let count = previewCount;
    if (count === null) {
      count = await onPreview(payload);
    }

    if (count === null) return;

    if (count === 0) {
      showWarningToast("No hay destinatarios para el alcance seleccionado.");
      return;
    }

    setConfirmOpen(true);
  };

  const toggleRoute = (routeId: string) => {
    setSelectedRouteIds((prev) =>
      prev.includes(routeId) ? prev.filter((id) => id !== routeId) : [...prev, routeId],
    );
    onClearPreview();
  };

  const resetForm = () => {
    setTitle("");
    setBody("");
    setScope("all");
    setSelectedRouteIds([]);
    setZoneNamesRaw("");
    setIsUrgent(false);
    setScheduleEnabled(false);
    onClearPreview();
  };

  const handlePreview = async () => {
    if (!payload) return;
    await onPreview(payload);
  };

  const handleConfirmSend = async () => {
    if (!payload) return;
    const result = await onSend(payload);
    if (result) {
      setConfirmOpen(false);
      resetForm();
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Nueva alerta masiva</CardTitle>
          <CardDescription>
            Comunica emergencias o novedades a todos los usuarios, por ruta o por zona.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <DialogField label="Título" htmlFor="alert-title">
            <Input
              id="alert-title"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                onClearPreview();
              }}
              placeholder="Ej. Mantenimiento del sistema"
              maxLength={120}
            />
          </DialogField>

          <DialogField label="Mensaje" htmlFor="alert-body">
            <Textarea
              id="alert-body"
              value={body}
              onChange={(e) => {
                setBody(e.target.value);
                onClearPreview();
              }}
              placeholder="Describe la alerta para los destinatarios..."
              rows={4}
            />
          </DialogField>

          <DialogField label="Alcance">
            <RadioGroup
              value={scope}
              onValueChange={(value) => {
                setScope(value as AlertScope);
                onClearPreview();
              }}
              className="grid gap-2 sm:grid-cols-3"
            >
              {([
                ["all", "Todos los usuarios"],
                ["route", "Por ruta"],
                ["zone", "Por zona (ciudad)"],
              ] as const).map(([value, label]) => (
                <Label
                  key={value}
                  htmlFor={`scope-${value}`}
                  className={cn(
                    "flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2",
                    scope === value && "border-primary bg-primary/5",
                  )}
                >
                  <RadioGroupItem id={`scope-${value}`} value={value} />
                  <span className="text-sm">{label}</span>
                </Label>
              ))}
            </RadioGroup>
          </DialogField>

          {scope === "route" ? (
            <DialogField label="Rutas destino">
              {routesLoading ? (
                <p className="text-sm text-muted-foreground">Cargando rutas...</p>
              ) : routes.length === 0 ? (
                <p className="text-sm text-muted-foreground">No hay rutas disponibles.</p>
              ) : (
                <div className="max-h-48 space-y-2 overflow-y-auto rounded-lg border p-3">
                  {routes.map((route) => (
                    <Label key={route.id} className="flex cursor-pointer items-center gap-2 text-sm">
                      <Checkbox
                        checked={selectedRouteIds.includes(route.id)}
                        onCheckedChange={() => { toggleRoute(route.id); }}
                      />
                      <span>{route.name}</span>
                    </Label>
                  ))}
                </div>
              )}
            </DialogField>
          ) : null}

          {scope === "zone" ? (
            <DialogField label="Zonas (ciudades)" htmlFor="zone-names">
              <Textarea
                id="zone-names"
                value={zoneNamesRaw}
                onChange={(e) => {
                  setZoneNamesRaw(e.target.value);
                  onClearPreview();
                }}
                placeholder="Una ciudad por línea o separadas por coma. Ej: Manizales, Centro"
                rows={3}
              />
            </DialogField>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <Label className="flex cursor-pointer items-start gap-3 rounded-lg border p-3">
              <Checkbox
                checked={isUrgent}
                disabled={scheduleEnabled}
                onCheckedChange={(checked) => {
                  setIsUrgent(checked === true);
                  onClearPreview();
                }}
              />
              <div>
                <p className="font-medium">Marcar como urgente</p>
                <p className="text-xs text-muted-foreground">
                  Envío inmediato con notificación push en tiempo real.
                </p>
              </div>
            </Label>

            <Label className="flex cursor-pointer items-start gap-3 rounded-lg border p-3">
              <Checkbox
                checked={scheduleEnabled}
                onCheckedChange={(checked) => {
                  const enabled = checked === true;
                  setScheduleEnabled(enabled);
                  if (enabled) setIsUrgent(false);
                  onClearPreview();
                }}
              />
              <div className="min-w-0 flex-1">
                <p className="font-medium">Programar envío</p>
                <p className="text-xs text-muted-foreground">
                  Define fecha y hora para el envío automático.
                </p>
                {scheduleEnabled ? (
                  <Input
                    type="datetime-local"
                    className="mt-2"
                    value={scheduledAtLocal}
                    min={toLocalDatetimeValue(new Date())}
                    onChange={(e) => {
                      setScheduledAtLocal(e.target.value);
                      onClearPreview();
                    }}
                  />
                ) : null}
              </div>
            </Label>
          </div>

          {previewCount === null ? (
            <p className="text-sm text-muted-foreground">
              Calcula los destinatarios antes de enviar, o usa &quot;Enviar alerta&quot; para calcularlos automáticamente.
            </p>
          ) : null}

          {previewCount !== null ? (
            <div className="flex items-center gap-3 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3">
              <Users className="size-5 text-primary" />
              <div>
                <p className="font-medium">{previewCount} destinatarios</p>
                <p className="text-xs text-muted-foreground">
                  Revisa el conteo antes de confirmar el envío.
                </p>
              </div>
            </div>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={!canPreview || previewLoading || sending}
              onClick={() => { void handlePreview(); }}
            >
              <Users className="mr-2 size-4" />
              {previewLoading ? "Calculando..." : "Vista previa destinatarios"}
            </Button>

            <Button
              type="button"
              disabled={!canSend}
              onClick={() => { void handleSendClick(); }}
            >
              {scheduleEnabled ? (
                <>
                  <CalendarClock className="mr-2 size-4" />
                  Programar alerta
                </>
              ) : (
                <>
                  <Send className="mr-2 size-4" />
                  Enviar alerta
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar envío</DialogTitle>
            <DialogDescription>
              {previewCount !== null
                ? `Se enviará a ${previewCount} destinatario${previewCount === 1 ? "" : "s"}.`
                : "Confirma el envío de la alerta masiva."}
            </DialogDescription>
          </DialogHeader>

          {payload ? (
            <div className="space-y-1 rounded-lg border bg-accent/20 p-3 text-sm">
              <p className="font-medium">{payload.title}</p>
              <p className="text-muted-foreground whitespace-pre-wrap">{payload.body}</p>
            </div>
          ) : null}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => { setConfirmOpen(false); }}>
              Cancelar
            </Button>
            <Button type="button" disabled={sending} onClick={() => { void handleConfirmSend(); }}>
              {sending ? "Enviando..." : "Confirmar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
