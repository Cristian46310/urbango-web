import type { BusinessPage } from '@/core/types/BusinessPage';

export interface RouteStop {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  location?: string;
  type?: string;
}

export interface RouteNode {
  /** ID del nodo en ms-business (requerido en POST /boarding). */
  id?: string;
  order: number;
  estimatedTimeMinutes?: number;
  stop: RouteStop;
}

export interface RouteListItem {
  id: string;
  code?: string;
  name: string;
  description: string;
  price: number;
  createdAt?: string;
}

export interface RouteDetail extends RouteListItem {
  nodes?: RouteNode[];
  stops?: RouteStop[];
}

/** Paradero seleccionable en abordaje/descenso */
export interface BoardingStopOption {
  nodeId: string;
  order: number;
  name: string;
  location?: string;
  latitude: number;
  longitude: number;
}

export interface BoardingRouteStops {
  routeId: string;
  routeName: string;
  stops: BoardingStopOption[];
}

export interface BoardingPayload {
  busId: string;
  paymentMethodCitizenId: string;
  nodeId: string;
}

export interface BoardingResponse {
  success?: boolean;
  message: string;
  ticketId: string;
  remainingBalance: number;
  boardedAt: string;
}

export interface AlightPayload {
  nodeId: string;
  busId: string;
}

export interface AlightResponse {
  message: string;
  ticketId: string;
  completedAt: string;
  stopName: string;
  totalTravelTime: number;
}

export interface CitizenTicket {
  id: string;
  status: 'active' | 'completed';
  amount?: number;
  buyedAt?: string;
  boardedAt?: string;
  completedAt?: string | null;
  historyId?: string;
  routeName?: string;
  busPlate?: string;
  schedulerId?: string;
  busId?: string;
}

export type TicketPage = BusinessPage<CitizenTicket>;

export interface TripValidation {
  order: number;
  stop: RouteStop;
  validatedAt: string;
  type: 'boarding' | 'alighting';
}

export interface TripDetails {
  tripId: string;
  route?: RouteDetail;
  bus?: { id: string; plate: string; model?: string };
  driver?: { id: string; name: string };
  validations: TripValidation[];
  totalTime: { minutes: number; formatted: string };
}

export interface StartTurnPayload {
  busStatus: string;
  observations?: string;
  latitude?: number;
  longitude?: number;
}

export interface StartTurnResponse {
  success?: boolean;
  message?: string;
  turnId: string;
  bus: { id: string; placa?: string; plate?: string; modelo?: string; model?: string };
  startTime: string;
  scheduledStartTime?: string;
  status: string;
}

/** POST /turn/end — mirrors startTurn field names (observations); turnId when known locally. */
export interface EndTurnPayload {
  turnId?: string;
  observations?: string;
}

export interface EndTurnResponse {
  success?: boolean;
  message?: string;
  turnId?: string;
  endTime?: string;
  status?: string;
}

/** GET /turn/current — source of truth for driver active turn. */
export interface CurrentTurn {
  id: string;
  /** Same as id; kept for callers that already use turnId. */
  turnId: string;
  busId?: string;
  driverId?: string;
  status: string;
  active: boolean;
  startTime?: string;
  endTime?: string;
  scheduledStartTime?: string;
  busPlate?: string;
  bus?: { id?: string; plate?: string; placa?: string; model?: string; modelo?: string };
  message?: string;
}

export interface BusListItem {
  id: string;
  plate: string;
  model?: string;
  capacity?: number;
}
