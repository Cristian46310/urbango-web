import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Search, Loader, Ticket, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { myTickets, getActiveTicketId } from "@/services/ticketService";
import type { CitizenTicket } from "@/services/ticketService";
export function TicketAlightSearch() {
  const navigate = useNavigate();
  const [ticketId, setTicketId] = useState("");
  const [activeTickets, setActiveTickets] = useState<CitizenTicket[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingActive, setLoadingActive] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const stored = getActiveTicketId();
    void myTickets({ status: "active", page: 1, limit: 10 })
      .then((page) => {
        const items = page.items;
        if (stored && !items.some((t) => t.id === stored)) {
          setActiveTickets([{ id: stored, status: "active" }, ...items]);
        } else {
          setActiveTickets(items);
        }
      })
      .catch(() => {
        if (stored) {
          setActiveTickets([{ id: stored, status: "active" }]);
        }
      })
      .finally(() => setLoadingActive(false));
  }, []);

  const handleSearch = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!ticketId.trim()) {
      setError("Ingresa el ID del boleto");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      void navigate(`/app/ticket/${ticketId.trim()}/alight`);
    } catch {
      setError("Error al buscar el boleto. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold">Descenso</h1>
        <p className="text-sm text-muted-foreground">Cierra tu viaje y libera tu cupo en el bus</p>
      </div>

      {!loadingActive && activeTickets.length > 0 ? (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Ticket className="h-4 w-4" />
              Boletos activos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {activeTickets.map((ticket) => (
              <Button
                key={ticket.id}
                variant="outline"
                className="w-full justify-between"
                asChild
              >
                <Link to={`/app/ticket/${ticket.id}/alight`}>
                  <span className="truncate">{ticket.id}</span>
                  <ArrowRight className="h-4 w-4 shrink-0" />
                </Link>
              </Button>
            ))}
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={(e) => { void handleSearch(e); }} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="ticket-id" className="block text-sm font-medium">
                ID de boleto manual
              </label>
              <Input
                id="ticket-id"
                placeholder="UUID del boleto"
                value={ticketId}
                onChange={(e) => {
                  setTicketId(e.target.value);
                  setError(null);
                }}
                disabled={loading}
              />
            </div>

            {error ? (
              <p className="text-sm text-destructive">{error}</p>
            ) : null}

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? (
                <>
                  <Loader className="mr-2 h-4 w-4 animate-spin" />
                  Buscando...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" />
                  Continuar
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
