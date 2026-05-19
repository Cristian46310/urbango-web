import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { showErrorToast, showSuccessToast } from "@/lib/toast";
import { board } from "@/services/boardingService";
import type { BoardingResponse } from "@/services/boardingService";
import { getBuses } from "@/services/busService";
import type { BusItem } from "@/services/busService";
import { getMyPaymentMethods } from "@/services/paymentService";
import type { PaymentMethodItem } from "@/services/paymentService";
import { getStops } from "@/services/stopService";
import type { StopItem } from "@/services/stopService";
import { useGeolocation } from "@/hooks/useGeolocation";

function distanceBetween(lat1: number, lon1: number, lat2: number, lon2: number) {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default function CitizenBoardingPage() {
  const [buses, setBuses] = useState<BusItem[]>([]);
  const [methods, setMethods] = useState<PaymentMethodItem[]>([]);
  const [stops, setStops] = useState<StopItem[]>([]);
  const [busId, setBusId] = useState("");
  const [paymentMethodCitizenId, setPaymentMethodCitizenId] = useState("");
  const [nodeId, setNodeId] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<BoardingResponse | null>(null);
  const geolocation = useGeolocation();

  useEffect(() => {
    void getBuses().then(setBuses).catch((error) => {
      showErrorToast(`Error cargando buses: ${(error as Error).message}`);
    });
    void getMyPaymentMethods().then(setMethods).catch((error) => {
      showErrorToast(`Error cargando métodos de pago: ${(error as Error).message}`);
    });
    void getStops().then(setStops).catch((error) => {
      showErrorToast(`Error cargando paraderos: ${(error as Error).message}`);
    });
  }, []);

  const nearestStop = useMemo(() => {
    if (!geolocation.latitude || !geolocation.longitude || stops.length === 0) {
      return null;
    }

    return stops.reduce<StopItem | null>((closest, stop) => {
      const distance = distanceBetween(geolocation.latitude!, geolocation.longitude!, stop.lat, stop.lng);
      if (!closest) {
        return stop;
      }
      const currentDistance = distanceBetween(geolocation.latitude!, geolocation.longitude!, closest.lat, closest.lng);
      return distance < currentDistance ? stop : closest;
    }, null);
  }, [geolocation.latitude, geolocation.longitude, stops]);

  useEffect(() => {
    if (nearestStop) {
      setNodeId(nearestStop.id);
    }
  }, [nearestStop]);

  const handleBoard = async () => {
    if (!busId || !paymentMethodCitizenId || !nodeId) {
      showErrorToast("Selecciona bus, método de pago y paradero.");
      return;
    }

    try {
      setLoading(true);
      const response = await board({ busId, paymentMethodCitizenId, nodeId });
      setResult(response);
      showSuccessToast("Abordaje registrado con éxito.");
    } catch (error) {
      showErrorToast(`Error al abordar: ${(error as Error).message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="space-y-6 p-6">
      <section className="rounded-3xl border border-(--security-border) bg-(--security-surface) p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-(--security-foreground)">Abordar</h1>
        <p className="mt-2 text-sm text-(--security-muted-foreground)">Selecciona el bus y método de pago, luego abórdalo desde el paradero cercano.</p>

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="bus-select">Bus</Label>
              <Input
                id="bus-select"
                list="buses-list"
                placeholder="Selecciona o escribe la placa/ID"
                value={busId}
                onChange={(event) => setBusId(event.target.value)}
              />
              <datalist id="buses-list">
                {buses.map((bus) => (
                  <option key={bus.id} value={bus.id} />
                ))}
              </datalist>
            </div>

            <div className="space-y-2">
              <Label htmlFor="payment-method" >Método de pago</Label>
              <Input
                id="payment-method"
                list="payment-methods-list"
                placeholder="Selecciona método de pago"
                value={paymentMethodCitizenId}
                onChange={(event) => setPaymentMethodCitizenId(event.target.value)}
              />
              <datalist id="payment-methods-list">
                {methods.map((method) => (
                  <option key={method.id} value={method.id}>{method.type} - Saldo {method.balance}</option>
                ))}
              </datalist>
            </div>

            <div className="space-y-2">
              <Label htmlFor="node-id">Paradero</Label>
              <Input
                id="node-id"
                value={nodeId}
                onChange={(event) => setNodeId(event.target.value)}
                placeholder="Ingresa el ID del paradero"
              />
            </div>
          </div>

          <div className="rounded-3xl border border-(--security-border) bg-(--security-surface) p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-(--security-foreground)">Geolocalización</h2>
            <p className="mt-3 text-sm text-(--security-muted-foreground)">Latitud: {geolocation.latitude ?? "n/a"}</p>
            <p className="text-sm text-(--security-muted-foreground)">Longitud: {geolocation.longitude ?? "n/a"}</p>
            <p className="mt-3 text-sm text-(--security-muted-foreground)">Paradero cercano: {nearestStop?.name ?? "No disponible"}</p>
            <Button type="button" onClick={() => {
              if (nearestStop) {
                setNodeId(nearestStop.id);
              }
            }} disabled={!nearestStop} className="mt-4 w-full">
              Usar paradero cercano
            </Button>
            {geolocation.error ? <p className="mt-3 text-sm text-red-500">{geolocation.error}</p> : null}
          </div>
        </div>

        <Button type="button" onClick={handleBoard} disabled={loading} className="mt-4">
          Abordar
        </Button>
      </section>

      {result ? (
        <section className="rounded-3xl border border-(--security-border) bg-(--security-surface) p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-(--security-foreground)">Resultado</h2>
          <p className="mt-3 text-sm text-(--security-muted-foreground)">{result.message ?? "Abordaje completado."}</p>
          {result.remainingBalance !== undefined ? (
            <p className="mt-2 text-base font-semibold text-(--security-foreground)">Saldo restante: {result.remainingBalance}</p>
          ) : null}
        </section>
      ) : null}
    </main>
  );
}
