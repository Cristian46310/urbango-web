import { useEffect, useId, useMemo, useState } from "react";
import { Bus, Clock, Hash, Loader2, Upload, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { httpMsBussines } from "@/infra/api/builderHttp";
import { ENDPOINTS } from "@/infra/api/endpoints";
import { showSuccessToast, showErrorToast } from "@/lib/toast";
import { getApiErrorMessage } from "@/lib/api-error";
import { readLastTurnSummary } from "@/lib/lastTurnSummary";
import { cn } from "@/lib/utils";
import {
  INCIDENT_SEVERITY_LABELS,
  INCIDENT_TYPE_LABELS,
  INCIDENT_TYPE_OPTIONS,
  type IncidentSeverity,
  type IncidentType,
} from "@/core/domain/entities/business/Incident";

const MAX_PHOTOS = 5;
const DESCRIPTION_MAX = 1000;

const SEVERITY_OPTIONS: {
  value: IncidentSeverity;
  className: string;
  activeClassName: string;
}[] = [
  {
    value: "low",
    className: "border-slate-300 bg-slate-50 text-slate-700 hover:bg-slate-100",
    activeClassName: "border-slate-600 bg-slate-200 ring-2 ring-slate-400/40",
  },
  {
    value: "medium",
    className: "border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100",
    activeClassName: "border-amber-500 bg-amber-200 ring-2 ring-amber-400/40",
  },
  {
    value: "high",
    className: "border-orange-300 bg-orange-50 text-orange-900 hover:bg-orange-100",
    activeClassName: "border-orange-500 bg-orange-200 ring-2 ring-orange-400/40",
  },
  {
    value: "critical",
    className: "border-red-300 bg-red-50 text-red-900 hover:bg-red-100",
    activeClassName: "border-red-600 bg-red-200 ring-2 ring-red-400/40",
  },
];

function formatNow() {
  return new Date().toLocaleString("es-CO", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

export function IncidentReportButton() {
  const navigate = useNavigate();
  const fileInputId = useId();
  const [type, setType] = useState<IncidentType | "">("");
  const [severity, setSeverity] = useState<IncidentSeverity | "">("");
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [discardOpen, setDiscardOpen] = useState(false);
  const [errors, setErrors] = useState<{
    type?: string;
    severity?: string;
    description?: string;
  }>({});
  const [nowLabel, setNowLabel] = useState(formatNow);
  const turnContext = useMemo(() => readLastTurnSummary(), []);

  const filePreviews = useMemo(
    () => files.map((file) => ({ file, url: URL.createObjectURL(file) })),
    [files],
  );

  const isDirty =
    Boolean(type) ||
    Boolean(severity) ||
    description.trim().length > 0 ||
    files.length > 0;

  useEffect(() => {
    const timer = window.setInterval(() => setNowLabel(formatNow()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    return () => {
      filePreviews.forEach(({ url }) => {
        URL.revokeObjectURL(url);
      });
    };
  }, [filePreviews]);

  function onFilesChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files ? Array.from(e.target.files) : [];
    e.target.value = "";
    if (selected.length === 0) return;
    if (selected.length + files.length > MAX_PHOTOS) {
      showErrorToast(`Puedes adjuntar hasta ${MAX_PHOTOS} fotografías`);
      return;
    }
    setFiles((prev) => [...prev, ...selected].slice(0, MAX_PHOTOS));
  }

  function removeFile(idx: number) {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  }

  function validate() {
    const next: typeof errors = {};
    if (!type) next.type = "Selecciona el tipo de incidente";
    if (!severity) next.severity = "Selecciona el nivel de gravedad";
    if (!description.trim()) next.description = "Describe lo ocurrido";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);

    const getPosition = () =>
      new Promise<GeolocationPosition | null>((res) => {
        if (!("geolocation" in navigator)) {
          res(null);
          return;
        }
        navigator.geolocation.getCurrentPosition(
          (pos) => res(pos),
          () => res(null),
          { enableHighAccuracy: true, timeout: 10_000 },
        );
      });

    const pos = await getPosition();
    if (!pos) {
      setSubmitting(false);
      showErrorToast("No se pudo obtener la ubicación GPS del reporte");
      return;
    }

    try {
      const form = new FormData();
      form.append("type", type);
      form.append("severity", severity);
      form.append("description", description.trim());
      form.append("timestamp", new Date().toISOString());
      form.append("latitude", String(pos.coords.latitude));
      form.append("longitude", String(pos.coords.longitude));

      files.forEach((f) => {
        form.append("photos", f, f.name);
      });

      await httpMsBussines.post(ENDPOINTS.INCIDENT_REPORTS.BASE, form);

      showSuccessToast("Reporte enviado correctamente");
      setType("");
      setSeverity("");
      setDescription("");
      setFiles([]);
      setErrors({});
    } catch (error) {
      showErrorToast(getApiErrorMessage(error, "Error enviando reporte"));
    } finally {
      setSubmitting(false);
    }
  }

  function handleCancelClick() {
    if (isDirty) {
      setDiscardOpen(true);
      return;
    }
    void navigate("/app");
  }

  function confirmDiscard() {
    setDiscardOpen(false);
    void navigate("/app");
  }

  const photosAtMax = files.length >= MAX_PHOTOS;

  return (
    <>
      <div className="mx-auto w-full max-w-[600px] px-4 sm:px-0">
        <form
          onSubmit={(event) => {
            void handleSubmit(event);
          }}
          className="space-y-5"
          noValidate
        >
          <section className="space-y-3 rounded-xl border bg-card p-4 shadow-sm">
            <p className="text-sm font-medium">Contexto del turno</p>
            <div className="grid gap-3 text-sm sm:grid-cols-3">
              <div className="flex items-start gap-2">
                <Bus className="mt-0.5 size-4 shrink-0 text-teal-800" aria-hidden />
                <div>
                  <p className="text-xs text-muted-foreground">Bus asignado</p>
                  <p className="font-medium">{turnContext?.busPlate ?? "Sin turno activo"}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Hash className="mt-0.5 size-4 shrink-0 text-teal-800" aria-hidden />
                <div>
                  <p className="text-xs text-muted-foreground">ID de turno</p>
                  <p className="font-mono text-xs font-medium">
                    {turnContext?.turnId
                      ? `${turnContext.turnId.slice(0, 8)}…`
                      : "—"}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Clock className="mt-0.5 size-4 shrink-0 text-teal-800" aria-hidden />
                <div>
                  <p className="text-xs text-muted-foreground">Hora actual</p>
                  <p className="font-medium">{nowLabel}</p>
                </div>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              El bus y el turno se asocian automáticamente a tu reporte. No necesitas ingresarlos.
            </p>
          </section>

          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="incident-type">
              Tipo de incidente <span className="text-red-600">*</span>
            </label>
            <Select
              value={type || undefined}
              onValueChange={(v) => {
                setType(v as IncidentType);
                setErrors((prev) => ({ ...prev, type: undefined }));
              }}
            >
              <SelectTrigger
                id="incident-type"
                className={cn("h-11 w-full", errors.type && "border-red-500")}
              >
                <SelectValue placeholder="Selecciona el tipo" />
              </SelectTrigger>
              <SelectContent>
                {INCIDENT_TYPE_OPTIONS.map((option) => (
                  <SelectItem key={option} value={option}>
                    {INCIDENT_TYPE_LABELS[option]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.type ? (
              <p className="text-sm text-destructive">{errors.type}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">
              Nivel de gravedad <span className="text-red-600">*</span>
            </p>
            <div
              className="grid grid-cols-2 gap-2 sm:grid-cols-4"
              role="radiogroup"
              aria-label="Nivel de gravedad"
            >
              {SEVERITY_OPTIONS.map((option) => {
                const selected = severity === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => {
                      setSeverity(option.value);
                      setErrors((prev) => ({ ...prev, severity: undefined }));
                    }}
                    className={cn(
                      "h-11 rounded-lg border px-2 text-sm font-medium transition-colors",
                      option.className,
                      selected && option.activeClassName,
                    )}
                  >
                    {INCIDENT_SEVERITY_LABELS[option.value]}
                  </button>
                );
              })}
            </div>
            {errors.severity ? (
              <p className="text-sm text-destructive">{errors.severity}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="incident-description">
              Descripción <span className="text-red-600">*</span>
            </label>
            <Textarea
              id="incident-description"
              value={description}
              onChange={(e) => {
                setDescription(e.target.value.slice(0, DESCRIPTION_MAX));
                setErrors((prev) => ({ ...prev, description: undefined }));
              }}
              placeholder="Describe brevemente lo ocurrido"
              className={cn("min-h-28 w-full", errors.description && "border-red-500")}
              maxLength={DESCRIPTION_MAX}
            />
            {errors.description ? (
              <p className="text-sm text-destructive">{errors.description}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor={fileInputId}>
              Fotografías ({files.length}/{MAX_PHOTOS})
            </label>
            <input
              id={fileInputId}
              type="file"
              accept="image/*"
              multiple
              onChange={onFilesChange}
              className="sr-only"
              disabled={photosAtMax || submitting}
            />
            <Button
              variant="outline"
              className="h-11 w-full"
              asChild={!photosAtMax}
              disabled={photosAtMax || submitting}
            >
              {photosAtMax ? (
                <span className="inline-flex items-center gap-2">
                  <Upload className="size-4" />
                  Máximo de fotos alcanzado
                </span>
              ) : (
                <label htmlFor={fileInputId} className="inline-flex cursor-pointer items-center gap-2">
                  <Upload className="size-4" />
                  Subir fotografías
                </label>
              )}
            </Button>
            {filePreviews.length > 0 ? (
              <div className="flex flex-wrap gap-2 pt-1">
                {filePreviews.map(({ file, url }, i) => (
                  <div
                    key={`${file.name}-${file.lastModified.toString()}-${file.size.toString()}`}
                    className="relative h-20 w-20 overflow-hidden rounded-md border"
                  >
                    <img src={url} alt={file.name} className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeFile(i)}
                      aria-label={`Quitar ${file.name}`}
                      className="absolute right-1 top-1 inline-flex size-7 items-center justify-center rounded-full bg-red-600 text-white shadow-sm"
                    >
                      <X className="size-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          <div className="grid gap-2 pt-1 sm:grid-cols-2">
            <Button
              type="submit"
              disabled={submitting}
              className="h-11 w-full bg-teal-700 text-base font-semibold text-white hover:bg-teal-600"
            >
              {submitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                "Enviar"
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleCancelClick}
              disabled={submitting}
              className="h-11 w-full"
            >
              Cancelar
            </Button>
          </div>
        </form>
      </div>

      <Dialog open={discardOpen} onOpenChange={setDiscardOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Descartar este reporte?</DialogTitle>
            <DialogDescription>
              Perderás los datos y las fotos que ya ingresaste.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDiscardOpen(false)}>
              Seguir editando
            </Button>
            <Button type="button" variant="destructive" onClick={confirmDiscard}>
              Descartar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default IncidentReportButton;
