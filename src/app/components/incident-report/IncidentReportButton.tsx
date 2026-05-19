"use client"

import React, { useEffect, useId, useMemo, useState } from "react";
import { Upload, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { httpMsBussines } from "@/infra/api/builderHttp";
import { ENDPOINTS } from "@/infra/api/endpoints";
import { showSuccessToast, showErrorToast, showLoadingToast, dismissToast } from "@/lib/toast";

type IncidentType = "mechanical" | "accident" | "delay" | "other";
type IncidentSeverity = "low" | "medium" | "high" | "critical";

export function IncidentReportButton() {
  const navigate = useNavigate();
  const fileInputId = useId();
  const [type, setType] = useState<IncidentType>("mechanical");
  const [severity, setSeverity] = useState<IncidentSeverity>("low");
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const filePreviews = useMemo(
    () => files.map((file) => ({ file, url: URL.createObjectURL(file) })),
    [files]
  );

  function onFilesChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files ? Array.from(e.target.files) : [];
    if (selected.length + files.length > 5) {
      showErrorToast("Puedes adjuntar hasta 5 fotografías");
      return;
    }
    setFiles((prev) => [...prev, ...selected]);
  }

  function removeFile(idx: number) {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  }

  useEffect(() => {
    return () => {
      filePreviews.forEach(({ url }) => {
        URL.revokeObjectURL(url);
      });
    };
  }, [filePreviews]);

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    const loadingId = showLoadingToast("Enviando reporte...");

    // get geo
    const getPosition = () => new Promise<GeolocationPosition | null>((res) => {
      if (!("geolocation" in navigator)) {
        res(null);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          res(pos);
        },
        () => {
          res(null);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    });

    const pos = await getPosition();

    if (!pos) {
      dismissToast(loadingId);
      setSubmitting(false);
      showErrorToast("No se pudo obtener la ubicación GPS del reporte");
      return;
    }

    const timestamp = new Date().toISOString();

    try {

      const form = new FormData();
      form.append("type", type);
      form.append("severity", severity);
      form.append("description", description);
      form.append("timestamp", timestamp);
      form.append("latitude", String(pos.coords.latitude));
      form.append("longitude", String(pos.coords.longitude));

      files.forEach((f) => {
        form.append("photos", f, f.name);
      });

      await httpMsBussines.post(ENDPOINTS.INCIDENT_REPORTS.BASE, form);

      showSuccessToast("Reporte enviado correctamente");
      setType("mechanical");
      setSeverity("low");
      setDescription("");
      setFiles([]);
    } catch {
      showErrorToast("Error enviando reporte");
    } finally {
      dismissToast(loadingId);
      setSubmitting(false);
    }
  }

  return (
    <div className="w-full px-4 py-4 sm:px-6">
      <section className="mx-auto w-full max-w-2xl rounded-lg border bg-background p-4 shadow-sm sm:p-6">
        <div className="mb-4 space-y-1">
          <h2 className="text-lg font-semibold">Reporte rápido de incidente</h2>
          <p className="text-sm text-muted-foreground">
            Registra un incidente desde una página independiente del panel.
          </p>
        </div>

        <form
          onSubmit={(event) => {
            void handleSubmit(event);
          }}
          className="grid gap-3"
        >
          <div className="grid gap-1">
            <label className="text-sm font-medium">Tipo de incidente</label>
            <Select
              value={type}
              onValueChange={(v) => {
                setType(v as IncidentType);
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue>{type}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mechanical">Mecánico</SelectItem>
                <SelectItem value="accident">Accidente</SelectItem>
                <SelectItem value="delay">Retraso</SelectItem>
                <SelectItem value="other">Otro</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-1">
            <label className="text-sm font-medium">Nivel de gravedad</label>
            <Select
              value={severity}
              onValueChange={(v) => {
                setSeverity(v as IncidentSeverity);
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue>{severity}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Bajo</SelectItem>
                <SelectItem value="medium">Medio</SelectItem>
                <SelectItem value="high">Alto</SelectItem>
                <SelectItem value="critical">Crítico</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1">
            <label className="text-sm font-medium">Descripción</label>
            <Textarea
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
              }}
              placeholder="Describe brevemente lo ocurrido"
              className="min-h-28 w-full"
            />
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium">Fotografías (hasta 5)</label>
            <input
              id={fileInputId}
              type="file"
              accept="image/*"
              multiple
              onChange={onFilesChange}
              className="sr-only"
            />
            <Button variant="outline" className="w-full" asChild>
              <label htmlFor={fileInputId} className="cursor-pointer">
                <Upload className="size-4" />
                Subir fotografías
              </label>
            </Button>
            <div className="flex flex-wrap gap-2">
              {filePreviews.map(({ file, url }, i) => (
                <div
                  key={`${file.name}-${file.lastModified.toString()}-${file.size.toString()}`}
                  className="relative h-20 w-20 overflow-hidden rounded-md border"
                >
                  <img src={url} alt={file.name} className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => {
                      removeFile(i);
                    }}
                    aria-label={`Quitar ${file.name}`}
                    className="absolute right-1 top-1 inline-flex size-6 items-center justify-center rounded-full bg-red-600 text-white shadow-sm"
                  >
                    <X className="size-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-2 pt-2 sm:grid-cols-2">
            <Button type="submit" disabled={submitting} className="w-full">
              Enviar
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                void navigate("/app");
              }}
              className="w-full"
            >
              Cancelar
            </Button>
          </div>
        </form>
      </section>
    </div>
  );
}

export default IncidentReportButton;
