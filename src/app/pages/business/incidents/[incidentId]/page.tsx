import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  AlertTriangle,
  ArrowLeft,
  Bus,
  CalendarClock,
  Camera,
  ChevronDown,
  ChevronUp,
  CircleAlert,
  Clock3,
  Loader2,
  MessageSquare,
  RefreshCw,
  ShieldAlert,
  User,
  Wrench,
} from "lucide-react";

import { useIncident } from "@/hooks/business";
import type {
  Incident,
  IncidentSeverity,
  IncidentStatus,
  IncidentType,
} from "@/core/domain/entities/business";
import {
  formatIncidentDateLong,
  formatIncidentRadicado,
  INCIDENT_SEVERITY_LABELS,
  INCIDENT_STATUS_FLOW,
  INCIDENT_STATUS_LABELS,
  incidentSeverityLabel,
  incidentStatusLabel,
  incidentTypeLabel,
} from "@/core/domain/entities/business";
import { useAuthStore } from "@/store/security/authStore";
import { ROLE_GROUPS } from "@/core/domain/entities/security/Roles";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const COMMENT_MAX = 500;
const DESCRIPTION_PREVIEW = 280;

const STATUS_BADGE: Record<IncidentStatus, string> = {
  reported: "border-blue-200 bg-blue-50 text-blue-800",
  in_review: "border-amber-300 bg-amber-50 text-amber-900",
  closed: "border-emerald-200 bg-emerald-50 text-emerald-800",
};

const SEVERITY_BADGE: Record<IncidentSeverity, string> = {
  low: "border-slate-300 bg-slate-100 text-slate-700",
  medium: "border-amber-300 bg-amber-50 text-amber-900",
  high: "border-orange-300 bg-orange-50 text-orange-900",
  critical: "border-red-300 bg-red-50 text-red-800",
};

const TYPE_ICON: Record<IncidentType, typeof Wrench> = {
  mechanical: Wrench,
  accident: CircleAlert,
  delay: Clock3,
  passenger: User,
  other: ShieldAlert,
};

function StatusBadge({ status }: { status: IncidentStatus | string }) {
  const key = status as IncidentStatus;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        STATUS_BADGE[key] ?? "border-slate-200 bg-slate-100 text-slate-700",
      )}
    >
      {incidentStatusLabel(status)}
    </span>
  );
}

function SeverityBadge({ severity }: { severity: IncidentSeverity | string }) {
  const key = severity as IncidentSeverity;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        SEVERITY_BADGE[key] ?? SEVERITY_BADGE.medium,
      )}
    >
      {incidentSeverityLabel(severity)}
    </span>
  );
}

function busLabel(incident: Incident): string {
  const plate = incident.bus?.plate?.trim();
  const routeName = incident.bus?.routeName?.trim();
  if (plate && routeName) return `${plate} - ${routeName}`;
  if (plate) return plate;
  if (routeName) return routeName;
  if (incident.busId) return `Bus ${incident.busId.slice(0, 8)}…`;
  return "—";
}

function IncidentDetailSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Cargando detalle del incidente">
      <div className="rounded-2xl border border-(--security-border) bg-[#F8FAFB] px-6 py-5 shadow-sm">
        <Skeleton className="mb-4 h-9 w-28" />
        <Skeleton className="mb-2 h-8 w-64" />
        <div className="mt-3 flex flex-wrap gap-2">
          <Skeleton className="h-7 w-44" />
          <Skeleton className="h-7 w-24" />
        </div>
      </div>
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-2/3" />
          <div className="flex gap-2 pt-2">
            <Skeleton className="h-20 w-28 rounded-lg" />
            <Skeleton className="h-20 w-28 rounded-lg" />
          </div>
        </CardContent>
      </Card>
      <div className="flex justify-center py-4">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    </div>
  );
}

export default function IncidentDetailPage() {
  const { incidentId = "" } = useParams();
  const navigate = useNavigate();
  const { hasAnyRole } = useAuthStore();
  const canChangeStatus = hasAnyRole(ROLE_GROUPS.ADMIN_ROLES);

  const {
    currentIncident,
    comments,
    detailLoading,
    error,
    loadById,
    loadComments,
    addComment,
    changeStatus,
  } = useIncident();

  const [status, setStatus] = useState<IncidentStatus>("reported");
  const [statusComment, setStatusComment] = useState("");
  const [savingStatus, setSavingStatus] = useState(false);

  const [commentText, setCommentText] = useState("");
  const [commentError, setCommentError] = useState<string | null>(null);
  const [savingComment, setSavingComment] = useState(false);

  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadDetail = async () => {
    if (!incidentId) return;
    setLoadError(null);
    try {
      const loaded = await loadById(incidentId);
      setStatus(loaded.status);
    } catch (err) {
      setLoadError((err as Error).message || "No se pudo cargar el incidente");
      return;
    }
    try {
      await loadComments(incidentId);
    } catch {
      // El toast del store ya informa; el detalle permanece usable.
    }
  };

  useEffect(() => {
    void loadDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [incidentId]);

  useEffect(() => {
    if (currentIncident?.id === incidentId) {
      setStatus(currentIncident.status);
    }
  }, [currentIncident, incidentId]);

  const incident = currentIncident?.id === incidentId ? currentIncident : null;
  const photos = useMemo(
    () =>
      (incident?.photos ?? []).filter((photo) => Boolean(photo.publicUrl ?? photo.url)),
    [incident],
  );

  const description = incident?.description?.trim() ?? "";
  const descriptionNeedsExpand = description.length > DESCRIPTION_PREVIEW;
  const descriptionShown =
    descriptionNeedsExpand && !descriptionExpanded
      ? `${description.slice(0, DESCRIPTION_PREVIEW).trimEnd()}…`
      : description;

  const TypeIcon = incident ? (TYPE_ICON[incident.type] ?? ShieldAlert) : ShieldAlert;

  const handleStatusSave = async () => {
    if (!incidentId || !canChangeStatus || !incident) return;
    const note = statusComment.trim();
    const statusChanged = status !== incident.status;
    if (!statusChanged && !note) return;

    setSavingStatus(true);
    try {
      if (statusChanged) {
        await changeStatus(incidentId, status);
      }
      if (note) {
        const label = INCIDENT_STATUS_LABELS[status] ?? status;
        await addComment(incidentId, {
          text: `[Cambio de estado → ${label}] ${note}`.slice(0, COMMENT_MAX),
        });
        setStatusComment("");
      }
    } catch {
      // Toast already shown; keep form values
    } finally {
      setSavingStatus(false);
    }
  };

  const handleAddComment = async () => {
    const text = commentText.trim();
    if (!text) {
      setCommentError("Escribe un comentario antes de enviarlo.");
      return;
    }
    if (text.length > COMMENT_MAX) {
      setCommentError(`Máximo ${COMMENT_MAX} caracteres.`);
      return;
    }
    setCommentError(null);
    setSavingComment(true);
    try {
      await addComment(incidentId, { text });
      setCommentText("");
    } catch {
      // Toast already shown; keep draft
    } finally {
      setSavingComment(false);
    }
  };

  const goBack = () => {
    void navigate("/app/business/incidents");
  };

  return (
    <div className="bg-(--security-surface) px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl space-y-6">
        {detailLoading && !incident ? (
          <IncidentDetailSkeleton />
        ) : loadError && !incident ? (
          <div className="space-y-4">
            <Button type="button" variant="outline" onClick={goBack} className="gap-2">
              <ArrowLeft className="size-4" />
              Volver
            </Button>
            <div
              role="alert"
              className="flex flex-col gap-3 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-red-900 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 size-5 shrink-0" />
                <div>
                  <p className="font-semibold">No se pudo cargar el incidente</p>
                  <p className="text-sm opacity-90">{loadError || error}</p>
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                className="shrink-0 border-red-300 bg-white"
                onClick={() => { void loadDetail(); }}
              >
                <RefreshCw className="size-4" />
                Reintentar
              </Button>
            </div>
          </div>
        ) : incident ? (
          <>
            <header className="rounded-2xl border border-(--security-border) bg-[#F8FAFB] px-5 py-5 shadow-sm sm:px-6">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={goBack}
                className="mb-4 gap-2 font-medium"
              >
                <ArrowLeft className="size-4" />
                Volver
              </Button>

              <h1 className="text-2xl font-semibold tracking-tight text-(--security-foreground)">
                Detalle de incidente
              </h1>

              <div className="mt-3 flex flex-wrap items-center gap-2.5">
                <p className="font-mono text-sm font-semibold tracking-wide text-slate-800 sm:text-base">
                  Radicado:{" "}
                  <span className="text-slate-950">
                    {formatIncidentRadicado(incident.id, incident.reportedAt || incident.createdAt)}
                  </span>
                </p>
                <StatusBadge status={incident.status} />
              </div>
            </header>

            <Card className="border-(--security-border) shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Datos del incidente</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <dl className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1">
                    <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Tipo
                    </dt>
                    <dd className="flex items-center gap-2 text-sm font-medium text-slate-900">
                      <TypeIcon className="size-4 text-slate-500" aria-hidden />
                      {incidentTypeLabel(incident.type)}
                    </dd>
                  </div>

                  <div className="space-y-1">
                    <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Gravedad
                    </dt>
                    <dd>
                      <SeverityBadge severity={incident.severity} />
                    </dd>
                  </div>

                  <div className="space-y-1">
                    <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Bus
                    </dt>
                    <dd className="flex items-center gap-2 text-sm font-medium text-slate-900">
                      <Bus className="size-4 text-slate-500" aria-hidden />
                      {busLabel(incident)}
                    </dd>
                  </div>

                  <div className="space-y-1">
                    <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Conductor
                    </dt>
                    <dd className="flex items-center gap-2 text-sm font-medium text-slate-900">
                      <User className="size-4 text-slate-500" aria-hidden />
                      {incident.driver?.name?.trim() || "—"}
                    </dd>
                  </div>

                  <div className="space-y-1 sm:col-span-2">
                    <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Fecha de reporte
                    </dt>
                    <dd className="flex items-center gap-2 text-sm font-medium text-slate-900">
                      <CalendarClock className="size-4 text-slate-500" aria-hidden />
                      {formatIncidentDateLong(incident.reportedAt || incident.createdAt)}
                    </dd>
                  </div>
                </dl>

                <div className="space-y-2 border-t border-(--security-border) pt-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Descripción
                  </p>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-800">
                    {descriptionShown || "Sin descripción"}
                  </p>
                  {descriptionNeedsExpand ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2 text-xs"
                      onClick={() => { setDescriptionExpanded((v) => !v); }}
                    >
                      {descriptionExpanded ? (
                        <>
                          <ChevronUp className="size-3.5" />
                          Ver menos
                        </>
                      ) : (
                        <>
                          <ChevronDown className="size-3.5" />
                          Ver más
                        </>
                      )}
                    </Button>
                  ) : null}
                </div>

                <div className="space-y-3 border-t border-(--security-border) pt-4">
                  <div className="flex items-center gap-2">
                    <Camera className="size-4 text-slate-500" aria-hidden />
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Fotos adjuntas
                    </p>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700 tabular-nums">
                      {photos.length === 0
                        ? "Sin fotos"
                        : `${photos.length} foto${photos.length === 1 ? "" : "s"}`}
                    </span>
                  </div>

                  {photos.length > 0 ? (
                    <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-1">
                      {photos.map((photo, index) => {
                        const src = photo.publicUrl ?? photo.url ?? "";
                        return (
                          <button
                            key={photo.id}
                            type="button"
                            className="group relative h-24 w-32 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                            onClick={() => { setPhotoPreviewUrl(src); }}
                            aria-label={`Ver foto ${index + 1}`}
                          >
                            <img
                              src={src}
                              alt={photo.originalName ?? `Foto ${index + 1}`}
                              className="size-full object-cover transition-transform group-hover:scale-105"
                            />
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Este reporte no incluye fotografías.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {canChangeStatus ? (
              <Card className="border-(--security-border) shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Cambiar estado</CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="space-y-2">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Flujo sugerido
                    </p>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {INCIDENT_STATUS_FLOW.map((step, index) => (
                        <div key={step} className="flex items-center gap-1.5">
                          {index > 0 ? (
                            <span className="text-xs text-muted-foreground" aria-hidden>
                              →
                            </span>
                          ) : null}
                          <button
                            type="button"
                            onClick={() => { setStatus(step); }}
                            className={cn(
                              "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                              status === step
                                ? STATUS_BADGE[step]
                                : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
                            )}
                          >
                            {INCIDENT_STATUS_LABELS[step]}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="incident-status">Estado</Label>
                    <Select
                      value={status}
                      onValueChange={(value) => { setStatus(value as IncidentStatus); }}
                      disabled={savingStatus}
                    >
                      <SelectTrigger id="incident-status" className="h-11 w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {INCIDENT_STATUS_FLOW.map((option) => (
                          <SelectItem key={option} value={option}>
                            {INCIDENT_STATUS_LABELS[option]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Estado actual del reporte:{" "}
                      <span className="font-medium text-slate-700">
                        {incidentStatusLabel(incident.status)}
                      </span>
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="status-comment">
                      Comentario de cambio de estado{" "}
                      <span className="font-normal text-muted-foreground">(opcional)</span>
                    </Label>
                    <Textarea
                      id="status-comment"
                      value={statusComment}
                      onChange={(e) => { setStatusComment(e.target.value.slice(0, COMMENT_MAX)); }}
                      rows={3}
                      disabled={savingStatus}
                      placeholder="Explica por qué cierras o resuelves el incidente…"
                    />
                  </div>

                  <Button
                    type="button"
                    onClick={() => { void handleStatusSave(); }}
                    disabled={
                      savingStatus
                      || (status === incident.status && !statusComment.trim())
                    }
                    className="min-w-40"
                  >
                    {savingStatus ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        Guardando...
                      </>
                    ) : (
                      "Guardar cambios"
                    )}
                  </Button>
                </CardContent>
              </Card>
            ) : null}

            <Card className="border-(--security-border) shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <MessageSquare className="size-5 text-slate-500" aria-hidden />
                  Comentarios
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="max-h-80 space-y-3 overflow-y-auto pr-1">
                  {comments.length === 0 ? (
                    <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50/80 px-4 py-6 text-center text-sm text-muted-foreground">
                      Aún no hay comentarios en este incidente
                    </p>
                  ) : (
                    comments.map((comment) => (
                      <article
                        key={comment.id}
                        className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm"
                      >
                        <div className="mb-1 flex flex-wrap items-baseline justify-between gap-2">
                          <p className="font-semibold text-slate-900">
                            {comment.authorName?.trim() || "Usuario"}
                          </p>
                          <time className="text-xs text-muted-foreground">
                            {formatIncidentDateLong(comment.createdAt)}
                          </time>
                        </div>
                        <p className="whitespace-pre-wrap leading-relaxed text-slate-700">
                          {comment.text}
                        </p>
                      </article>
                    ))
                  )}
                </div>

                <div className="space-y-3 border-t border-(--security-border) pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="new-comment">Nuevo comentario</Label>
                    <Textarea
                      id="new-comment"
                      value={commentText}
                      onChange={(e) => {
                        setCommentText(e.target.value.slice(0, COMMENT_MAX));
                        if (commentError) setCommentError(null);
                      }}
                      rows={3}
                      disabled={savingComment}
                      placeholder="Agrega un comentario (máx. 500 caracteres)"
                      aria-invalid={Boolean(commentError)}
                    />
                    <div className="flex items-center justify-between gap-2">
                      {commentError ? (
                        <p className="text-xs text-destructive" role="alert">
                          {commentError}
                        </p>
                      ) : (
                        <span className="text-xs text-muted-foreground" />
                      )}
                      <p className="text-xs tabular-nums text-muted-foreground">
                        {commentText.length}/{COMMENT_MAX}
                      </p>
                    </div>
                  </div>

                  <Button
                    type="button"
                    onClick={() => { void handleAddComment(); }}
                    disabled={savingComment}
                  >
                    {savingComment ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        Agregando...
                      </>
                    ) : (
                      "Agregar comentario"
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Dialog
              open={Boolean(photoPreviewUrl)}
              onOpenChange={(open) => {
                if (!open) setPhotoPreviewUrl(null);
              }}
            >
              <DialogContent className="max-w-3xl border-none bg-transparent p-0 shadow-none">
                <DialogTitle className="sr-only">Vista previa de foto</DialogTitle>
                {photoPreviewUrl ? (
                  <img
                    src={photoPreviewUrl}
                    alt="Foto del incidente"
                    className="max-h-[80vh] w-full rounded-xl object-contain"
                  />
                ) : null}
              </DialogContent>
            </Dialog>
          </>
        ) : (
          <IncidentDetailSkeleton />
        )}
      </div>
    </div>
  );
}
