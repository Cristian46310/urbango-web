import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Bus, Clock, Loader2, MapPin, Search, Ticket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  getActiveTicketSnapshot,
  myTickets,
} from "@/services/ticketService";
import type { CitizenTicket } from "@/services/ticketService";
import { cn } from "@/lib/utils";

type ActiveTicketView = CitizenTicket & {
  boardingStopName?: string;
};

function formatBoardedAt(value?: string | null) {
  if (!value) return null;
  return new Date(value).toLocaleString("es-CO", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function formatElapsed(from?: string | null) {
  if (!from) return null;
  const started = new Date(from).getTime();
  if (Number.isNaN(started)) return null;
  const mins = Math.max(0, Math.round((Date.now() - started) / 60_000));
  if (mins < 60) return `${mins} min en viaje`;
  const hours = Math.floor(mins / 60);
  const rest = mins % 60;
  return rest > 0 ? `${hours} h ${rest} min en viaje` : `${hours} h en viaje`;
}

function mergeActiveTickets(
  apiItems: CitizenTicket[],
  snapshot: ReturnType<typeof getActiveTicketSnapshot>,
): ActiveTicketView[] {
  const byId = new Map<string, ActiveTicketView>();

  for (const item of apiItems) {
    byId.set(item.id, item);
  }

  if (snapshot?.id) {
    const existing = byId.get(snapshot.id);
    byId.set(snapshot.id, {
      id: snapshot.id,
      status: "active",
      boardedAt: existing?.boardedAt ?? snapshot.boardedAt,
      routeName: existing?.routeName ?? snapshot.routeName,
      busPlate: existing?.busPlate ?? snapshot.busPlate,
      busId: existing?.busId ?? snapshot.busId,
      boardingStopName: existing?.boardingStopName ?? snapshot.boardingStopName,
      amount: existing?.amount,
      buyedAt: existing?.buyedAt,
      historyId: existing?.historyId,
      schedulerId: existing?.schedulerId,
    });
  }

  return Array.from(byId.values());
}

export function TicketAlightSearch() {
  const navigate = useNavigate();
  const [ticketId, setTicketId] = useState("");
  const [activeTickets, setActiveTickets] = useState<ActiveTicketView[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingActive, setLoadingActive] = useState(true);
  const [showManual, setShowManual] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const snapshot = getActiveTicketSnapshot();
    void myTickets({ status: "active", page: 1, limit: 10 })
      .then((page) => {
        setActiveTickets(mergeActiveTickets(page.items, snapshot));
      })
      .catch(() => {
        setActiveTickets(mergeActiveTickets([], snapshot));
      })
      .finally(() => setLoadingActive(false));
  }, []);

  useEffect(() => {
    if (!loadingActive && activeTickets.length === 0) {
      setShowManual(true);
    }
  }, [loadingActive, activeTickets.length]);

  const handleSearch = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!ticketId.trim()) {
      setError("Ingresa el ID del boleto");
      return;
    }

    setError(null);
    setLoading(true);
    void navigate(`/app/ticket/${ticketId.trim()}/alight`);
  };

  return (
    <div className="mx-auto w-full max-w-xl space-y-5">
      {loadingActive ? (
        <div className="flex items-center justify-center gap-2 rounded-xl border bg-card px-4 py-10 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Buscando tu viaje activo…
        </div>
      ) : null}

      {!loadingActive && activeTickets.length > 0 ? (
        <div className="space-y-3">
          <p className="text-sm font-medium text-foreground">Tu viaje activo</p>
          {activeTickets.map((ticket) => {
            const boardedLabel = formatBoardedAt(ticket.boardedAt);
            const elapsed = formatElapsed(ticket.boardedAt);
            return (
              <Card
                key={ticket.id}
                className="border-teal-200 bg-teal-50/40 shadow-sm"
              >
                <CardContent className="space-y-4 pt-5">
                  <div className="flex items-start gap-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-teal-100 text-teal-800">
                      <Ticket className="size-5" aria-hidden />
                    </span>
                    <div className="min-w-0 space-y-1.5">
                      <p className="font-semibold text-teal-950">
                        {ticket.routeName ?? "Viaje en curso"}
                      </p>
                      <div className="space-y-1 text-sm text-teal-900/80">
                        {ticket.busPlate ? (
                          <p className="flex items-center gap-1.5">
                            <Bus className="size-3.5 shrink-0" aria-hidden />
                            Bus {ticket.busPlate}
                          </p>
                        ) : null}
                        {boardedLabel ? (
                          <p className="flex items-center gap-1.5">
                            <Clock className="size-3.5 shrink-0" aria-hidden />
                            Abordaste a las {boardedLabel}
                            {elapsed ? ` · ${elapsed}` : ""}
                          </p>
                        ) : (
                          <p className="text-muted-foreground">Boleto activo listo para cerrar</p>
                        )}
                        {ticket.boardingStopName ? (
                          <p className="flex items-center gap-1.5">
                            <MapPin className="size-3.5 shrink-0" aria-hidden />
                            Desde {ticket.boardingStopName}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  </div>
                  <Button
                    asChild
                    className="h-11 w-full text-base font-semibold bg-teal-600 text-white hover:bg-teal-500"
                  >
                    <Link to={`/app/ticket/${ticket.id}/alight`}>Confirmar descenso</Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : null}

      {!loadingActive && activeTickets.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="space-y-2 px-6 py-8 text-center">
            <Ticket className="mx-auto size-8 text-muted-foreground/70" aria-hidden />
            <p className="font-medium">No tienes un boleto activo</p>
            <p className="text-sm text-muted-foreground">
              Cuando abordes un bus, tu viaje aparecerá aquí para cerrarlo en un toque.
            </p>
            <Button asChild variant="secondary" className="mt-2">
              <Link to="/app/boarding">Ir a abordar</Link>
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <div className="rounded-xl border border-border/80 bg-card/60">
        <button
          type="button"
          className={cn(
            "flex w-full items-center justify-between px-4 py-3 text-left text-sm",
            "text-muted-foreground hover:text-foreground",
          )}
          onClick={() => setShowManual((v) => !v)}
          aria-expanded={showManual}
        >
          <span>¿No ves tu boleto? Ingresa el ID manualmente</span>
          <span className="text-xs">{showManual ? "Ocultar" : "Mostrar"}</span>
        </button>

        {showManual ? (
          <form onSubmit={handleSearch} className="space-y-3 border-t px-4 pb-4 pt-3">
            <div className="space-y-2">
              <label htmlFor="ticket-id" className="block text-sm font-medium">
                ID del boleto
              </label>
              <Input
                id="ticket-id"
                placeholder="Pega el UUID del boleto"
                value={ticketId}
                onChange={(e) => {
                  setTicketId(e.target.value);
                  setError(null);
                }}
                disabled={loading}
                autoComplete="off"
              />
              <p className="text-xs text-muted-foreground">
                Solo para soporte o si el viaje no aparece en la lista.
              </p>
            </div>

            {error ? <p className="text-sm text-destructive">{error}</p> : null}

            <Button type="submit" disabled={loading} variant="outline" className="w-full">
              {loading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Buscando…
                </>
              ) : (
                <>
                  <Search className="size-4" />
                  Buscar boleto
                </>
              )}
            </Button>
          </form>
        ) : null}
      </div>
    </div>
  );
}
