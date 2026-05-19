import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { CheckCircle, MapPin, Clock, AlertCircle, Loader, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface TicketData {
  id: string;
  passengerId: string;
  passengerName: string;
  routeName: string;
  busNumber: string;
  boardingStop: string;
  boardingTime: string;
  currentStop: string;
  status: "active" | "completed";
}

export function TicketAlightValidation() {
  const { ticketId } = useParams<{ ticketId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [validationComplete, setValidationComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Datos de ejemplo - en producción vendrían de una API
  const [ticketData] = useState<TicketData>({
    id: ticketId ?? "",
    passengerId: "P123456",
    passengerName: "Juan Pérez",
    routeName: "Ruta 5 - Centro a Pereira",
    busNumber: "BUS-2024-001",
    boardingStop: "Terminal Central",
    boardingTime: new Date(Date.now() - 45 * 60000).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" }),
    currentStop: "Paradero Calle 19",
    status: "active",
  });

  const handleValidateAlight = async () => {
    setLoading(true);
    setError(null);

    try {
      // Simulación de validación - en producción iría aquí la llamada a API
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // En producción aquí vendría la validación real del descenso
      setValidationComplete(true);

      // Auto-redirigir después de 3 segundos
      setTimeout(() => {
        void navigate("/app/ticket/alight");
      }, 3000);
    } catch {
      setError("Error al validar el descenso. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  if (validationComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 p-6 flex items-center justify-center">
        <Card className="w-full max-w-md shadow-xl border-green-200">
          <CardHeader className="space-y-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-t-lg text-center">
            <div className="flex justify-center">
              <CheckCircle className="w-16 h-16" />
            </div>
            <CardTitle className="text-2xl">¡Viaje Completado!</CardTitle>
          </CardHeader>

          <CardContent className="pt-6 space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center space-y-1">
              <p className="text-green-700 font-semibold text-lg">
                Gracias por usar nuestro servicio
              </p>
              <p className="text-green-600 text-sm">
                Tu viaje ha sido completado exitosamente
              </p>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center p-2 bg-slate-50 rounded">
                <span className="text-slate-600">Boleto:</span>
                <span className="font-semibold text-slate-900">{ticketData.id}</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-slate-50 rounded">
                <span className="text-slate-600">Ruta:</span>
                <span className="font-semibold text-slate-900">{ticketData.routeName}</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-slate-50 rounded">
                <span className="text-slate-600">Validación:</span>
                <span className="font-semibold text-slate-900">{new Date().toLocaleTimeString("es-CO")}</span>
              </div>
            </div>

            <div className="pt-4 text-xs text-slate-500 text-center">
              Serás redirigido automáticamente en 3 segundos...
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold text-slate-900">Validar Descenso</h1>
            <p className="text-slate-600">Revisa los detalles de tu viaje y confirma tu salida</p>
          </div>
          <button
            onClick={() => { void navigate("/app/ticket/alight"); }}
            className="p-2 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Boleto Activo */}
          <Card className="border-blue-200">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-700">Boleto Activo</p>
                  <p className="text-xl font-bold text-blue-600 mt-1">{ticketData.id}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Información del Pasajero */}
          <Card className="border-blue-200">
            <CardHeader>
              <CardTitle className="text-lg">Información del Viaje</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-slate-700 block mb-1">Pasajero</label>
                <p className="text-slate-900 font-medium">{ticketData.passengerName}</p>
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700 block mb-1">Ruta</label>
                <p className="text-slate-900 font-medium">{ticketData.routeName}</p>
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700 block mb-1">Bus</label>
                <p className="text-slate-900 font-medium">{ticketData.busNumber}</p>
              </div>
            </CardContent>
          </Card>

          {/* Paraderos y Horarios */}
          <div className="grid grid-cols-2 gap-4">
            <Card className="border-blue-200">
              <CardContent className="pt-6">
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-blue-600 flex-shrink-0 mt-1" />
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-slate-600 uppercase">Paradero de Subida</p>
                    <p className="text-sm font-semibold text-slate-900 mt-1">{ticketData.boardingStop}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-blue-200">
              <CardContent className="pt-6">
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-blue-600 flex-shrink-0 mt-1" />
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-slate-600 uppercase">Paradero de Bajada</p>
                    <p className="text-sm font-semibold text-slate-900 mt-1">{ticketData.currentStop}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Card className="border-blue-200">
              <CardContent className="pt-6">
                <div className="flex items-start gap-2">
                  <Clock className="w-4 h-4 text-blue-600 flex-shrink-0 mt-1" />
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-slate-600 uppercase">Hora de Subida</p>
                    <p className="text-sm font-semibold text-slate-900 mt-1">{ticketData.boardingTime}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-blue-200">
              <CardContent className="pt-6">
                <div className="flex items-start gap-2">
                  <Clock className="w-4 h-4 text-blue-600 flex-shrink-0 mt-1" />
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-slate-600 uppercase">Hora de Bajada</p>
                    <p className="text-sm font-semibold text-slate-900 mt-1">{new Date().toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Acciones */}
          <div className="space-y-2 pt-2">
            <Button
              onClick={() => { void handleValidateAlight(); }}
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader className="mr-2 w-4 h-4 animate-spin" />
                  Validando Descenso...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 w-4 h-4" />
                  Confirmar Descenso
                </>
              )}
            </Button>

            <Button
              onClick={() => { void navigate("/app/ticket/alight"); }}
              variant="outline"
              className="w-full border-blue-200 text-slate-700 hover:bg-blue-50"
              disabled={loading}
            >
              Cancelar
            </Button>
          </div>

          <p className="text-xs text-slate-500 text-center">
            Al confirmar, tu viaje será marcado como completado y el cupo será liberado inmediatamente
          </p>
        </div>
      </div>
    </div>
  );
}
