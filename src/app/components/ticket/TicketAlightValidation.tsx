import { useCallback, useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { CheckCircle, Loader, ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { alight } from "@/services/ticketService";
import type { AlightResponse } from "@/services/ticketService";
import { getBuses } from "@/services/busService";
import type { BusItem } from "@/services/busService";
import { getBoardingStopsForBus } from "@/services/routePlanningService";
import type { BoardingStopOption } from "@/core/domain/entities/business/Transit";
import { getApiErrorMessage } from "@/lib/api-error";
import { showErrorToast } from "@/lib/toast";
import { PageShell } from "@/app/components/security/page-shell";

export function TicketAlightValidation() {
  const { ticketId } = useParams<{ ticketId: string }>();
  const navigate = useNavigate();
  const [busId, setBusId] = useState("");
  const [nodeId, setNodeId] = useState("");
  const [buses, setBuses] = useState<BusItem[]>([]);
  const [stopOptions, setStopOptions] = useState<BoardingStopOption[]>([]);
  const [routeName, setRouteName] = useState("");
  const [loadingStops, setLoadingStops] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AlightResponse | null>(null);

  useEffect(() => {
    void getBuses()
      .then(setBuses)
      .catch(() => {
        /* optional list */
      });
  }, []);

  const loadStopsForBus = useCallback(async (selectedBusId: string) => {
    if (!selectedBusId) {
      setStopOptions([]);
      setRouteName("");
      setNodeId("");
      return;
    }

    setLoadingStops(true);
    setNodeId("");
    try {
      const { routeName: name, stops } = await getBoardingStopsForBus(selectedBusId);
      setRouteName(name);
      setStopOptions(stops);
    } catch (error) {
      setStopOptions([]);
      setRouteName("");
      showErrorToast(getApiErrorMessage(error, "No se pudieron cargar los paraderos"));
    } finally {
      setLoadingStops(false);
    }
  }, []);

  useEffect(() => {
    void loadStopsForBus(busId);
  }, [busId, loadStopsForBus]);

  const handleValidateAlight = async () => {
    if (!ticketId || !busId || !nodeId) {
      showErrorToast("Selecciona bus y paradero actual.");
      return;
    }

    setLoading(true);
    try {
      const response = await alight(ticketId, { busId, nodeId });
      setResult(response);
    } catch (error) {
      showErrorToast(getApiErrorMessage(error, "Error al validar el descenso"));
    } finally {
      setLoading(false);
    }
  };

  if (result) {
    return (
      <PageShell title="Viaje completado" description="Tu boleto fue cerrado correctamente.">
        <Card className="max-w-md border-green-200">
          <CardHeader className="text-center">
            <CheckCircle className="mx-auto h-12 w-12 text-green-600" />
            <CardTitle className="text-green-800">{result.message}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-center">
            <p>Paradero: {result.stopName}</p>
            <p>Tiempo de viaje: {result.totalTravelTime} min</p>
            <p className="text-muted-foreground">
              {new Date(result.completedAt).toLocaleString("es-CO")}
            </p>
            <Button className="w-full mt-4" onClick={() => void navigate("/app/ticket/alight")}>
              Volver
            </Button>
          </CardContent>
        </Card>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Confirmar descenso"
      description={`Boleto ${ticketId?.slice(0, 8) ?? ""}…`}
    >
      <Button asChild variant="ghost" className="mb-4 -ml-2">
        <Link to="/app/ticket/alight">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver
        </Link>
      </Button>

      <Card className="max-w-lg">
        <CardContent className="pt-6 space-y-4">
          <div className="space-y-2">
            <Label>Bus (mismo del viaje)</Label>
            <Select value={busId} onValueChange={setBusId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona el bus" />
              </SelectTrigger>
              <SelectContent>
                {buses.map((bus) => (
                  <SelectItem key={bus.id} value={bus.id}>
                    {bus.plate}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Paradero actual</Label>
            <Select
              value={nodeId}
              onValueChange={setNodeId}
              disabled={!busId || loadingStops || stopOptions.length === 0}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    !busId
                      ? "Primero selecciona el bus"
                      : loadingStops
                        ? "Cargando paraderos..."
                        : "Selecciona paradero"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {stopOptions.map((stop) => (
                  <SelectItem key={stop.nodeId} value={stop.nodeId}>
                    {stop.order}. {stop.name}
                    {stop.location ? ` — ${stop.location}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {loadingStops ? (
              <p className="flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" />
                Cargando paraderos…
              </p>
            ) : routeName ? (
              <p className="text-xs text-muted-foreground">Ruta: {routeName}</p>
            ) : null}
          </div>

          <Button
            type="button"
            className="w-full"
            disabled={loading || loadingStops || !nodeId}
            onClick={() => void handleValidateAlight()}
          >
            {loading ? (
              <>
                <Loader className="mr-2 h-4 w-4 animate-spin" />
                Validando...
              </>
            ) : (
              "Completar viaje"
            )}
          </Button>
        </CardContent>
      </Card>
    </PageShell>
  );
}
