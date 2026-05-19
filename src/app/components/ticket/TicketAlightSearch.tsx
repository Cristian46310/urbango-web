import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Loader, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

export function TicketAlightSearch() {
  const navigate = useNavigate();
  const [ticketId, setTicketId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!ticketId.trim()) {
      setError("Ingresa el número de boleto");
      return;
    }

    setError(null);
    setLoading(true);

    void (async () => {
      try {
        await new Promise((resolve) => setTimeout(resolve, 500));
        void navigate(`/app/ticket/${ticketId.trim()}/alight`);
      } catch {
        setError("Error al buscar el boleto. Intenta de nuevo.");
      } finally {
        setLoading(false);
      }
    })();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6 flex items-center justify-center">
      <div className="w-full max-w-md">
        <div className="mb-8 space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-blue-100">
              <MapPin className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Validar Descenso</h1>
              <p className="text-sm text-slate-600 mt-1">Cierra tu viaje y libera tu cupo</p>
            </div>
          </div>
        </div>

        <Card className="border-blue-200 shadow-lg">
          <CardContent className="pt-6">
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="ticket-id" className="block text-sm font-semibold text-slate-700">
                  Número de Boleto
                </label>
                <Input
                  id="ticket-id"
                  placeholder="Ingresa tu número de boleto"
                  value={ticketId}
                  onChange={(e) => {
                    setTicketId(e.target.value);
                    setError(null);
                  }}
                  disabled={loading}
                  className="text-base border-blue-200 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              {error && (
                <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader className="mr-2 w-4 h-4 animate-spin" />
                    Buscando...
                  </>
                ) : (
                  <>
                    <Search className="mr-2 w-4 h-4" />
                    Buscar Boleto
                  </>
                )}
              </Button>

              <p className="text-xs text-slate-500 text-center mt-6">
                Asegúrate de ingresar tu número de boleto correctamente
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
