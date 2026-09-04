import { httpMsBussines } from '@/infra/api/builderHttp';
import { ENDPOINTS } from '@/infra/api/endpoints';
import type {
  AlightPayload,
  AlightResponse,
  BoardingPayload,
  BoardingResponse,
  BoardingRouteStops,
  BoardingStopOption,
  BusListItem,
  CurrentTurn,
  EndTurnPayload,
  EndTurnResponse,
  RouteDetail,
  RouteListItem,
  StartTurnPayload,
  StartTurnResponse,
  TicketPage,
  TripDetails,
} from '@/core/domain/entities/business/Transit';
import type { BusinessPage } from '@/core/types/BusinessPage';
import type { Bus, Node, Scheduler } from '@/core/domain/entities/business';

export const ACTIVE_TICKET_STORAGE_KEY = 'activeTicketId';
export const ACTIVE_TICKET_SNAPSHOT_KEY = 'activeTicketSnapshot';

export interface ActiveTicketSnapshot {
  id: string;
  boardedAt?: string;
  busId?: string;
  busPlate?: string;
  routeName?: string;
  boardingStopName?: string;
}

function readActiveTicketSnapshot(): ActiveTicketSnapshot | null {
  try {
    const raw = localStorage.getItem(ACTIVE_TICKET_SNAPSHOT_KEY);
    if (!raw) {
      const legacyId = localStorage.getItem(ACTIVE_TICKET_STORAGE_KEY);
      return legacyId ? { id: legacyId } : null;
    }
    const parsed = JSON.parse(raw) as ActiveTicketSnapshot;
    if (!parsed?.id) {
      return null;
    }
    return parsed;
  } catch {
    const legacyId = localStorage.getItem(ACTIVE_TICKET_STORAGE_KEY);
    return legacyId ? { id: legacyId } : null;
  }
}

function writeActiveTicketSnapshot(snapshot: ActiveTicketSnapshot) {
  localStorage.setItem(ACTIVE_TICKET_STORAGE_KEY, snapshot.id);
  localStorage.setItem(ACTIVE_TICKET_SNAPSHOT_KEY, JSON.stringify(snapshot));
}

function getSchedulerWindow(scheduler: Scheduler): { start: number; end: number } | null {
  if (scheduler.startTime && scheduler.endTime) {
    return {
      start: new Date(scheduler.startTime).getTime(),
      end: new Date(scheduler.endTime).getTime(),
    };
  }

  if (scheduler.date && scheduler.departureTime) {
    const dateOnly = scheduler.date.includes('T')
      ? scheduler.date.slice(0, 10)
      : scheduler.date;
    const timePart = /^\d{2}:\d{2}:\d{2}$/.test(scheduler.departureTime)
      ? scheduler.departureTime
      : /^\d{2}:\d{2}$/.test(scheduler.departureTime)
        ? `${scheduler.departureTime}:00`
        : scheduler.departureTime;
    const start = new Date(`${dateOnly}T${timePart}`).getTime();
    const end = new Date(`${dateOnly}T23:59:59`).getTime();
    if (Number.isNaN(start)) {
      return null;
    }
    return { start, end };
  }

  return null;
}

export const transitRepository = {
  async listRoutes(params?: {
    page?: number;
    limit?: number;
    name?: string;
  }): Promise<BusinessPage<RouteListItem>> {
    return httpMsBussines.get<BusinessPage<RouteListItem>>(ENDPOINTS.ROUTE.BASE, {
      params: {
        page: params?.page ?? 1,
        limit: params?.limit ?? 50,
        ...(params?.name?.trim() ? { name: params.name.trim() } : {}),
      },
    });
  },

  async getRouteById(id: string): Promise<RouteDetail> {
    return httpMsBussines.get<RouteDetail>(ENDPOINTS.ROUTE.BY_ID(id));
  },

  async getBoardingStopsForBus(busId: string): Promise<BoardingRouteStops> {
    const schedulersPage = await httpMsBussines.get<BusinessPage<Scheduler>>(
      ENDPOINTS.SCHEDULER.BASE,
      { params: { page: 1, limit: 100 } },
    );

    const now = Date.now();
    const forBus = schedulersPage.items.filter((s) => s.bus?.id === busId);
    const active =
      forBus.find((s) => {
        const window = getSchedulerWindow(s);
        if (!window) {
          return false;
        }
        return now >= window.start && now <= window.end;
      }) ?? forBus[0];

    const routeId = active?.route?.id;
    if (!routeId) {
      throw new Error('No hay programación activa para este bus');
    }

    const route = await this.getRouteById(routeId);
    const stops = await resolveBoardingStopOptions(route);

    if (stops.length === 0) {
      const hasStopsInRoute =
        (route.nodes?.length ?? 0) > 0 || (route.stops?.length ?? 0) > 0;
      throw new Error(
        hasStopsInRoute
          ? 'La ruta tiene paraderos pero no se pudieron resolver los IDs de nodo para abordaje. Reinicia ms-business y vuelve a cargar el bus.'
          : 'La ruta no tiene paraderos configurados',
      );
    }

    return {
      routeId,
      routeName: route.name,
      stops,
    };
  },

  async board(payload: BoardingPayload): Promise<BoardingResponse> {
    const response = await httpMsBussines.post<BoardingResponse>(
      ENDPOINTS.BOARDING,
      payload,
    );
    if (response.ticketId) {
      writeActiveTicketSnapshot({
        id: response.ticketId,
        boardedAt: response.boardedAt,
      });
    }
    return response;
  },

  async myTickets(params?: {
    status?: 'active' | 'completed';
    page?: number;
    limit?: number;
  }): Promise<TicketPage> {
    return httpMsBussines.get<TicketPage>(ENDPOINTS.TICKET.ME, {
      params: {
        page: params?.page ?? 1,
        limit: params?.limit ?? 20,
        ...(params?.status ? { status: params.status } : {}),
      },
    });
  },

  async alight(ticketId: string, payload: AlightPayload): Promise<AlightResponse> {
    const response = await httpMsBussines.post<AlightResponse>(
      ENDPOINTS.TICKET.ALIGHT(ticketId),
      payload,
    );
    const stored = this.getActiveTicketId();
    if (stored === ticketId) {
      this.clearActiveTicket();
    }
    return response;
  },

  async getTripDetails(historyId: string): Promise<TripDetails> {
    return httpMsBussines.get<TripDetails>(ENDPOINTS.HISTORY.TRIP_DETAILS(historyId));
  },

  async startTurn(payload: StartTurnPayload): Promise<StartTurnResponse> {
    return httpMsBussines.post<StartTurnResponse>(ENDPOINTS.TURN.START, payload);
  },

  async endTurn(payload: EndTurnPayload): Promise<EndTurnResponse> {
    return httpMsBussines.post<EndTurnResponse>(ENDPOINTS.TURN.END, payload);
  },

  async getCurrentTurn(): Promise<CurrentTurn> {
    const raw = await httpMsBussines.get<unknown>(ENDPOINTS.TURN.CURRENT);
    return mapCurrentTurn(raw);
  },

  async updateBusGps(busId: string, latitude: number, longitude: number): Promise<void> {
    await httpMsBussines.post(ENDPOINTS.GPS.BUS(busId), { latitude, longitude });
  },

  async updateTurnGps(latitude: number, longitude: number): Promise<void> {
    await httpMsBussines.post(ENDPOINTS.TURN.GPS, { latitude, longitude });
  },

  async listBuses(page = 1, limit = 100): Promise<BusListItem[]> {
    const pageData = await httpMsBussines.get<BusinessPage<Bus>>(ENDPOINTS.BUS.BASE, {
      params: { page, limit },
    });
    return pageData.items.map((bus) => ({
      id: bus.id,
      plate: bus.plate,
      model: bus.model,
      capacity: bus.capacity,
    }));
  },

  getActiveTicketId(): string | null {
    return readActiveTicketSnapshot()?.id ?? localStorage.getItem(ACTIVE_TICKET_STORAGE_KEY);
  },

  getActiveTicketSnapshot(): ActiveTicketSnapshot | null {
    return readActiveTicketSnapshot();
  },

  setActiveTicketSnapshot(snapshot: ActiveTicketSnapshot): void {
    writeActiveTicketSnapshot(snapshot);
  },

  clearActiveTicket(): void {
    localStorage.removeItem(ACTIVE_TICKET_STORAGE_KEY);
    localStorage.removeItem(ACTIVE_TICKET_SNAPSHOT_KEY);
  },
};

export function totalRouteMinutes(route: RouteDetail): number {
  if (route.nodes?.length) {
    return route.nodes
      .slice()
      .sort((a, b) => a.order - b.order)
      .reduce((sum, node) => sum + (node.estimatedTimeMinutes ?? 0), 0);
  }
  return 0;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
}

function toStringValue(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function isActiveTurnStatus(status: string): boolean {
  return status === 'in_progress' || status === 'active' || status === 'en_curso';
}

/** Normalize GET /turn/current payloads (nested turn, active flag, or status-only). */
export function mapCurrentTurn(raw: unknown): CurrentTurn {
  const root = asRecord(raw) ?? {};
  const nested = asRecord(root.turn) ?? asRecord(root.data);
  const record = nested ?? root;

  const id =
    toStringValue(record.id) ||
    toStringValue(record.turnId) ||
    toStringValue(root.id) ||
    toStringValue(root.turnId);

  const status =
    toStringValue(record.status) || toStringValue(root.status) || '';

  const explicitActive = record.active ?? root.active;
  const active =
    typeof explicitActive === 'boolean'
      ? explicitActive
      : Boolean(id) && isActiveTurnStatus(status);

  const busRecord = asRecord(record.bus) ?? asRecord(root.bus);
  const busPlate =
    toStringValue(record.busPlate) ||
    toStringValue(root.busPlate) ||
    toStringValue(busRecord?.plate) ||
    toStringValue(busRecord?.placa) ||
    undefined;

  const busId =
    toStringValue(record.busId) ||
    toStringValue(root.busId) ||
    toStringValue(busRecord?.id) ||
    undefined;

  const driverId =
    toStringValue(record.driverId) ||
    toStringValue(record.conductorId) ||
    toStringValue(root.driverId) ||
    toStringValue(root.conductorId) ||
    undefined;

  return {
    id,
    turnId: id,
    busId: busId || undefined,
    driverId: driverId || undefined,
    status,
    active,
    startTime:
      toStringValue(record.startTime) ||
      toStringValue(root.startTime) ||
      undefined,
    endTime:
      toStringValue(record.endTime) || toStringValue(root.endTime) || undefined,
    scheduledStartTime:
      toStringValue(record.scheduledStartTime) ||
      toStringValue(root.scheduledStartTime) ||
      undefined,
    busPlate,
    bus: busRecord
      ? {
          id: toStringValue(busRecord.id) || undefined,
          plate: toStringValue(busRecord.plate) || undefined,
          placa: toStringValue(busRecord.placa) || undefined,
          model: toStringValue(busRecord.model) || undefined,
          modelo: toStringValue(busRecord.modelo) || undefined,
        }
      : undefined,
    message: toStringValue(record.message) || toStringValue(root.message) || undefined,
  };
}

async function fetchRouteNodes(routeId: string): Promise<Node[]> {
  const page = await httpMsBussines.get<BusinessPage<unknown>>(ENDPOINTS.NODE.BASE, {
    params: { page: 1, limit: 100 },
  });

  return page.items
    .map((raw, index): Node | null => {
      const record = asRecord(raw);
      if (!record) {
        return null;
      }
      const itemRouteId = toStringValue(record.routeId);
      if (itemRouteId !== routeId) {
        return null;
      }
      const stopId = toStringValue(record.stopId);
      const id = toStringValue(record.id);
      if (!stopId || !id) {
        return null;
      }
      return {
        id,
        routeId: itemRouteId,
        stopId,
        order: Number(record.order ?? index),
      };
    })
    .filter((item): item is Node => item !== null);
}

function resolveNodeId(
  order: number,
  stopId: string,
  explicitNodeId: string | undefined,
  routeNodes: Node[],
): string | undefined {
  if (explicitNodeId) {
    return explicitNodeId;
  }
  const byOrder = routeNodes.find(
    (n) => n.stopId === stopId && n.order === order,
  );
  if (byOrder?.id) {
    return byOrder.id;
  }
  return routeNodes.find((n) => n.stopId === stopId)?.id;
}

async function resolveBoardingStopOptions(route: RouteDetail): Promise<BoardingStopOption[]> {
  const routeNodes = await fetchRouteNodes(route.id);

  if (route.nodes?.length) {
    const options = route.nodes
      .slice()
      .sort((a, b) => a.order - b.order)
      .map((node): BoardingStopOption | null => {
        const stop = node.stop;
        if (!stop?.id) {
          return null;
        }
        const nodeId = resolveNodeId(node.order, stop.id, node.id, routeNodes);
        if (!nodeId) {
          return null;
        }
        return {
          nodeId,
          order: node.order,
          name: stop.name,
          location: stop.location,
          latitude: stop.latitude,
          longitude: stop.longitude,
        };
      })
      .filter((item): item is BoardingStopOption => item !== null);

    if (options.length > 0) {
      return options;
    }
  }

  const stopById = new Map((route.stops ?? []).map((s) => [s.id, s]));

  return routeNodes
    .sort((a, b) => a.order - b.order)
    .map((node): BoardingStopOption | null => {
      const stop = stopById.get(node.stopId);
      if (!stop) {
        return null;
      }
      return {
        nodeId: node.id,
        order: node.order,
        name: stop.name,
        location: stop.location,
        latitude: stop.latitude,
        longitude: stop.longitude,
      };
    })
    .filter((item): item is BoardingStopOption => item !== null);
}

export function orderedRouteStops(route: RouteDetail) {
  if (route.nodes?.length) {
    return route.nodes
      .slice()
      .sort((a, b) => a.order - b.order)
      .map((node) => ({
        ...node.stop,
        order: node.order,
        nodeId: node.id ?? node.stop.id,
        estimatedTimeMinutes: node.estimatedTimeMinutes ?? 0,
      }));
  }
  return (route.stops ?? []).map((stop, index) => ({
    ...stop,
    order: index + 1,
    nodeId: stop.id,
    estimatedTimeMinutes: 0,
  }));
}
