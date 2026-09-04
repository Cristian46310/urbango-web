import { useEffect, useId, useMemo, useState } from "react";
import { Copy, Check, Loader2, PlusCircle, Upload, X } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

import type { CreatePqrsInput, Pqrs, PqrsCategory, PqrsType } from "@/core/types/pqrs";
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
import { cn } from "@/lib/utils";
import { showErrorToast, showSuccessToast } from "@/lib/toast";
import { PqrsStatusBadge, typeLabels } from "./PqrsStatusBadge";

const DESCRIPTION_MAX = 500;
const MAX_IMAGES = 3;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ACCEPTED_MIME = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
]);

const AUTO_CATEGORY = "__auto__";

interface PqrsFormProps {
  creating: boolean;
  userId: string;
  userEmail: string;
  onSubmit: (input: CreatePqrsInput) => Promise<Pqrs | null>;
  onCreated?: (pqrs: Pqrs) => void;
}

function formatEstimatedResponse(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    return format(new Date(value), "d 'de' MMMM 'de' yyyy", { locale: es });
  } catch {
    return value;
  }
}

function PqrsConfirmation({
  pqrs,
  open,
  onBackToList,
}: {
  pqrs: Pqrs;
  open: boolean;
  onBackToList: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const estimated = formatEstimatedResponse(pqrs.estimated_response_at);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(pqrs.ticket_number);
      setCopied(true);
      showSuccessToast("Número de radicado copiado");
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      showErrorToast("No se pudo copiar el radicado");
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onBackToList(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>PQRS registrada</DialogTitle>
          <DialogDescription>
            Tu solicitud fue creada correctamente. Guarda el número de radicado.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 text-sm">
          <div className="rounded-xl border bg-muted/40 p-4 text-center">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Número de radicado
            </p>
            <p className="mt-1 font-mono text-xl font-semibold tracking-wide">
              {pqrs.ticket_number}
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-3 gap-2"
              onClick={() => { void handleCopy(); }}
            >
              {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
              {copied ? "Copiado" : "Copiar"}
            </Button>
          </div>

          <div className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2">
            <span className="text-muted-foreground">Estado inicial</span>
            <PqrsStatusBadge status={pqrs.status} />
          </div>

          <div className="rounded-lg border px-3 py-2">
            <span className="text-muted-foreground">Tipo</span>
            <p className="font-medium">{typeLabels[pqrs.type]}</p>
          </div>

          {estimated ? (
            <p className="text-muted-foreground">
              Respuesta estimada:{" "}
              <span className="font-medium text-foreground">{estimated}</span>
            </p>
          ) : null}
        </div>

        <DialogFooter>
          <Button type="button" onClick={onBackToList} className="w-full sm:w-auto">
            Volver al listado de PQRS
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function PqrsForm({
  creating,
  userId,
  userEmail,
  onSubmit,
  onCreated,
}: PqrsFormProps) {
  const fileInputId = useId();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<PqrsType>("complaint");
  const [category, setCategory] = useState<string>(AUTO_CATEGORY);
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [imagesError, setImagesError] = useState<string | null>(null);
  const [descriptionError, setDescriptionError] = useState<string | null>(null);
  const [createdPqrs, setCreatedPqrs] = useState<Pqrs | null>(null);

  const filePreviews = useMemo(
    () => files.map((file) => ({ file, url: URL.createObjectURL(file) })),
    [files],
  );

  useEffect(() => {
    return () => {
      filePreviews.forEach(({ url }) => {
        URL.revokeObjectURL(url);
      });
    };
  }, [filePreviews]);

  function resetForm() {
    setType("complaint");
    setCategory(AUTO_CATEGORY);
    setDescription("");
    setFiles([]);
    setImagesError(null);
    setDescriptionError(null);
  }

  function onFilesChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files ? Array.from(e.target.files) : [];
    e.target.value = "";
    if (selected.length === 0) return;

    setImagesError(null);

    if (files.length + selected.length > MAX_IMAGES) {
      setImagesError(`Puedes adjuntar hasta ${String(MAX_IMAGES)} imágenes`);
      return;
    }

    const invalidType = selected.find(
      (f) => !ACCEPTED_MIME.has(f.type) && !/\.(jpe?g|png|webp)$/i.test(f.name),
    );
    if (invalidType) {
      setImagesError("Solo se permiten imágenes JPEG, PNG o WebP");
      return;
    }

    const oversized = selected.find((f) => f.size > MAX_IMAGE_BYTES);
    if (oversized) {
      setImagesError("Cada imagen debe pesar máximo 5 MB");
      return;
    }

    setFiles((prev) => [...prev, ...selected].slice(0, MAX_IMAGES));
  }

  function removeFile(idx: number) {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
    setImagesError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!description.trim()) {
      setDescriptionError("Describe tu situación");
      return;
    }
    if (!userId || !userEmail) {
      showErrorToast("No se pudo identificar tu sesión. Vuelve a iniciar sesión.");
      return;
    }

    const result = await onSubmit({
      type,
      description: description.trim().slice(0, DESCRIPTION_MAX),
      userId,
      userEmail,
      ...(category !== AUTO_CATEGORY
        ? { category: category as PqrsCategory }
        : {}),
      images: files.length > 0 ? files : undefined,
    });

    if (result) {
      setOpen(false);
      resetForm();
      setCreatedPqrs(result);
      onCreated?.(result);
    }
  }

  const photosAtMax = files.length >= MAX_IMAGES;

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) resetForm();
        }}
      >
        <DialogTrigger asChild>
          <Button type="button" size="sm" disabled={!userId || !userEmail}>
            <PlusCircle className="mr-2 size-4" />
            Nueva PQRS
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Crear PQRS</DialogTitle>
            <DialogDescription>
              Registra tu petición, queja, reclamo o sugerencia.
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={(e) => {
              void handleSubmit(e);
            }}
            className="space-y-4"
            noValidate
          >
            <div className="space-y-2">
              <Label htmlFor="pqrs-type">Tipo</Label>
              <Select
                value={type}
                onValueChange={(v) => {
                  setType(v as PqrsType);
                }}
              >
                <SelectTrigger id="pqrs-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="petition">Petición</SelectItem>
                  <SelectItem value="complaint">Queja</SelectItem>
                  <SelectItem value="claim">Reclamo</SelectItem>
                  <SelectItem value="suggestion">Sugerencia</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor="pqrs-description">Descripción</Label>
                <span className="text-xs text-muted-foreground">
                  {description.length}/{DESCRIPTION_MAX}
                </span>
              </div>
              <Textarea
                id="pqrs-description"
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value.slice(0, DESCRIPTION_MAX));
                  setDescriptionError(null);
                }}
                placeholder="Describe tu situación..."
                maxLength={DESCRIPTION_MAX}
                rows={4}
                className={cn(descriptionError && "border-red-500")}
              />
              {descriptionError ? (
                <p className="text-sm text-destructive">{descriptionError}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="pqrs-category">Categoría (opcional)</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger id="pqrs-category">
                  <SelectValue placeholder="Clasificación automática" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={AUTO_CATEGORY}>
                    Dejar que el sistema clasifique automáticamente
                  </SelectItem>
                  <SelectItem value="driver">Conductor</SelectItem>
                  <SelectItem value="bus">Bus</SelectItem>
                  <SelectItem value="route">Ruta</SelectItem>
                  <SelectItem value="card">Tarjeta</SelectItem>
                  <SelectItem value="technical_support">Soporte Técnico</SelectItem>
                  <SelectItem value="other">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor={fileInputId}>
                Imágenes ({files.length}/{MAX_IMAGES})
              </Label>
              <input
                id={fileInputId}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                multiple
                onChange={onFilesChange}
                className="sr-only"
                disabled={photosAtMax || creating}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full"
                asChild={!photosAtMax}
                disabled={photosAtMax || creating}
              >
                {photosAtMax ? (
                  <span className="inline-flex items-center gap-2">
                    <Upload className="size-4" />
                    Máximo de imágenes alcanzado
                  </span>
                ) : (
                  <label
                    htmlFor={fileInputId}
                    className="inline-flex cursor-pointer items-center gap-2"
                  >
                    <Upload className="size-4" />
                    Adjuntar imágenes
                  </label>
                )}
              </Button>
              <p className="text-xs text-muted-foreground">
                JPEG, PNG o WebP · máx. 5 MB c/u · hasta 3 archivos
              </p>
              {imagesError ? (
                <p className="text-sm text-destructive">{imagesError}</p>
              ) : null}
              {filePreviews.length > 0 ? (
                <div className="flex flex-wrap gap-2 pt-1">
                  {filePreviews.map(({ file, url }, i) => (
                    <div
                      key={`${file.name}-${String(file.lastModified)}-${String(file.size)}`}
                      className="relative h-20 w-20 overflow-hidden rounded-md border"
                    >
                      <img
                        src={url}
                        alt={file.name}
                        className="h-full w-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          removeFile(i);
                        }}
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

            <p className="text-xs text-muted-foreground">
              Esto puede tardar unos segundos mientras procesamos tu solicitud.
            </p>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                disabled={creating}
                onClick={() => {
                  setOpen(false);
                }}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={creating}>
                {creating ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  "Enviar"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {createdPqrs ? (
        <PqrsConfirmation
          pqrs={createdPqrs}
          open={Boolean(createdPqrs)}
          onBackToList={() => {
            setCreatedPqrs(null);
          }}
        />
      ) : null}
    </>
  );
}
