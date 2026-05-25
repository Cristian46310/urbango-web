import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { startTurn } from "@/services/turnService";
import type { StartTurnResponse } from "@/services/turnService";
import { showErrorToast, showSuccessToast } from "@/lib/toast";

const BUS_STATUS_OPTIONS = [
  { value: "operativo", label: "Operativo" },
  { value: "mantenimiento", label: "Mantenimiento" },
  { value: "con observaciones", label: "Con observaciones" },
];

export default function DriverTurnStartPage() {
  const [busStatus, setBusStatus] = useState(BUS_STATUS_OPTIONS[0].value);
  const [observations, setObservations] = useState("");
  const [response, setResponse] = useState<StartTurnResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const result = await startTurn({ busStatus, observations: observations.trim() || undefined });
      setResponse(result);
      showSuccessToast("Turno iniciado correctamente.");
    } catch (error) {
      showErrorToast(`Error iniciando turno: ${(error as Error).message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="space-y-6 p-6">
      <section className="rounded-3xl border border-(--security-border) bg-(--security-surface) p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-(--security-foreground)">Iniciar turno</h1>
        <p className="mt-2 text-sm text-(--security-muted-foreground)">Registra el estado del bus y arranca el turno actual.</p>

        <div className="mt-6 space-y-4 max-w-2xl">
          <div className="space-y-2">
            <Label htmlFor="bus-status">Estado del bus</Label>
            <Input
              id="bus-status"
              value={busStatus}
              onChange={(event) => setBusStatus(event.target.value)}
              list="bus-status-options"
            />
            <datalist id="bus-status-options">
              {BUS_STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value} />
              ))}
            </datalist>
          </div>

          <div className="space-y-2">
            <Label htmlFor="observations">Observaciones</Label>
            <Textarea
              id="observations"
              value={observations}
              onChange={(event) => setObservations(event.target.value)}
              style={{ minHeight: 120 }}
              placeholder="Opcional"
            />
          </div>

          <Button type="button" onClick={handleSubmit} disabled={loading}>
            Iniciar turno
          </Button>
        </div>
      </section>

      {response ? (
        <section className="rounded-3xl border border-(--security-border) bg-(--security-surface) p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-(--security-foreground)">Turno en progreso</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-sm text-slate-500">Bus asignado</p>
              <p className="mt-2 text-lg font-semibold text-slate-900">{response.busAssigned ?? "No disponible"}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-sm text-slate-500">Hora de inicio</p>
              <p className="mt-2 text-lg font-semibold text-slate-900">{response.startTime ?? "No disponible"}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-sm text-slate-500">Estado</p>
              <p className="mt-2 text-lg font-semibold text-slate-900">{response.status ?? "in_progress"}</p>
            </div>
          </div>
        </section>
      ) : null}
    </main>
  );
}
