export interface Address {
  id: string;
  address: string;
  city: string;
  createdAt?: string;
}

export interface CreateAddressDTO {
  address: string;
  city: string;
}

export interface UpdateAddressDTO {
  address?: string;
  city?: string;
}

export interface Enterprise {
  id: string;
  name: string;
  nit: string;
  supervisorEmail?: string;
  createdAt?: string;
}

export interface CreateEnterpriseDTO {
  name: string;
  nit: string;
  supervisorEmail?: string;
}

export interface UpdateEnterpriseDTO {
  name?: string;
  nit?: string;
  supervisorEmail?: string;
}

/** Valores aceptados por ms-business en POST/PATCH /stop */
export type StopType = "terminal" | "intermediate" | "regular";

export const STOP_TYPE_LABELS: Record<StopType, string> = {
  regular: "Básico (Paradero de calle)",
  intermediate: "Estación / Troncal",
  terminal: "Terminal de integración",
};

export const STOP_TYPE_OPTIONS: StopType[] = ["regular", "intermediate", "terminal"];

export interface Stop {
  id: string;
  name: string;
  location: string;
  latitude: number;
  longitude: number;
  type?: StopType;
  createdAt?: string;
}

export interface CreateStopDTO {
  name: string;
  location: string;
  latitude: number;
  longitude: number;
  type: StopType;
}

export interface UpdateStopDTO {
  name?: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  type?: StopType;
}

export type PaymentMethodCode = "SYSTEM_CARD" | "CASH" | "EXTERNAL_CARD" | (string & {});

export interface PaymentMethod {
  id: string;
  name: string;
  /** Stable catalog key for UI logic (icons, saldo, recarga). */
  code?: PaymentMethodCode;
  isRechargeable?: boolean;
  createdAt?: string;
}

export interface CreatePaymentMethodDTO {
  name: string;
  code?: PaymentMethodCode;
  isRechargeable?: boolean;
}

export interface UpdatePaymentMethodDTO {
  name?: string;
  code?: PaymentMethodCode;
  isRechargeable?: boolean;
}

/** Nested address on citizen create/update (preferred over addressId). */
export interface CitizenAddressInput {
  address: string;
  city: string;
}

export interface CitizenAddress extends CitizenAddressInput {
  id?: string;
}

export interface Citizen {
  id: string;
  name: string;
  document: string;
  email?: string;
  phone?: string;
  extraInfo?: string;
  /** Legacy FK; still returned by API. Prefer `address`. */
  addressId?: string;
  address?: CitizenAddress | null;
  photoUrl?: string | null;
  createdAt?: string;
}

export interface CreateCitizenDTO {
  name: string;
  document: string;
  email?: string;
  phone?: string;
  extraInfo?: string;
  birthDate?: string;
  /** Nested domicile — do not send together with addressId. */
  address?: CitizenAddressInput;
  /** @deprecated Prefer nested `address`. */
  addressId?: string;
}

export interface UpdateCitizenDTO {
  name?: string;
  document?: string;
  email?: string;
  phone?: string;
  extraInfo?: string;
  birthDate?: string;
  address?: CitizenAddressInput;
  /** @deprecated Prefer nested `address`. */
  addressId?: string;
}

export interface Driver {
  id: string;
  userId?: string;
  enterpriseId?: string;
  name: string;
  document?: string;
  email?: string;
  phone?: string;
  licenseNumber: string;
  licenseExpiry: string;
  createdAt?: string;
}

export interface CreateDriverDTO {
  userId: string;
  enterpriseId: string;
  name: string;
  document: string;
  email: string;
  phone: string;
  licenseNumber: string;
  licenseExpiry: string;
}

export interface UpdateDriverDTO {
  name?: string;
  document?: string;
  email?: string;
  phone?: string;
  licenseNumber?: string;
  licenseExpiry?: string;
}

export interface RouteNodeInput {
  order: number;
  stopId: string;
  estimatedTimeMinutes: number;
}

export type {
  RouteListItem,
  RouteDetail,
  RouteNode,
  RouteStop,
  BoardingPayload,
  BoardingResponse,
  AlightPayload,
  AlightResponse,
  CitizenTicket,
  TripDetails,
  StartTurnPayload,
  StartTurnResponse,
  EndTurnPayload,
  EndTurnResponse,
  CurrentTurn,
} from './Transit';

export interface Route {
  id: string;
  name: string;
  description: string;
  price: number;
  stops?: Stop[];
  createdAt?: string;
}

export interface CreateRouteDTO {
  name: string;
  description: string;
  price: number;
  nodes?: RouteNodeInput[];
}

export interface UpdateRouteDTO {
  name?: string;
  description?: string;
  price?: number;
}

export interface Node {
  id: string;
  order: number;
  stopId: string;
  routeId: string;
}

export interface CreateNodeDTO {
  routeId: string;
  stopId: string;
  order: number;
}

export interface UpdateNodeDTO {
  order?: number;
}

import type { Bus as BusEntity } from './Bus';

export type { Bus, BusStatus, CreateBusDTO, UpdateBusDTO } from './Bus';
export { BUS_STATUS_LABELS, BUS_STATUS_OPTIONS } from './Bus';

export type SchedulerStatus = "programado" | "en_curso" | "completado" | "cancelado";

export interface Scheduler {
  id: string;
  bus?: BusEntity;
  route?: Route;
  date?: string;
  departureTime?: string;
  status?: SchedulerStatus;
  /** Legacy: algunas respuestas aún pueden incluir ventana explícita. */
  startTime?: string;
  endTime?: string;
  createdAt?: string;
}

export interface CreateSchedulerDTO {
  busId: string;
  routeId: string;
  date: string;
  departureTime: string;
  toleranceMinutes?: number;
  recurrenceType?: string;
}

export interface UpdateSchedulerDTO {
  busId?: string;
  routeId?: string;
  date?: string;
  departureTime?: string;
  status?: SchedulerStatus;
}

export type TurnStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled';

export const TURN_STATUS_OPTIONS: TurnStatus[] = [
  'scheduled',
  'in_progress',
  'completed',
  'cancelled',
];

export const TURN_STATUS_LABELS: Record<TurnStatus, string> = {
  scheduled: 'Programado',
  in_progress: 'En curso',
  completed: 'Completado',
  cancelled: 'Cancelado',
};

export interface Turn {
  id: string;
  startTime: string;
  endTime: string;
  status: TurnStatus;
  busId?: string;
  driverId?: string;
  bus?: Pick<BusEntity, "id" | "plate" | "status">;
  driver?: Pick<Driver, "id" | "name">;
  createdAt?: string;
}

export interface CreateTurnDTO {
  startTime: string;
  endTime: string;
  status?: TurnStatus;
  busId: string;
  driverId: string;
}

export interface UpdateTurnDTO {
  startTime?: string;
  endTime?: string;
  status?: TurnStatus;
  busId?: string;
  driverId?: string;
}

export interface RealtimeDashboardSummary {
  totalPassengersInTransit: number;
  updatedAt?: string;
  fullBusAlerts?: RealtimeBusLocation[];
  incidents?: RealtimeIncident[];
}

export interface RealtimeBusLocation {
  busId: string;
  plate: string;
  routeId?: string;
  routeName?: string;
  routeCode?: string;
  lat: number;
  lng: number;
  statusColor?: string;
  delayAlert?: boolean;
  isFull?: boolean;
  occupancyPercent?: number;
  estimatedMinutesToNextStop?: number;
  estimatedMinutesToWaitingStop?: number;
  nearestStop?: {
    id: string;
    name: string;
    distance?: number;
  };
  activePassengers?: number;
  stopName?: string;
  trackingPath?: string;
  paymentActionPath?: string;
}

export interface RealtimeIncident {
  id: string;
  busId: string;
  busPlate?: string;
  routeId?: string;
  routeName?: string;
  type: string;
  description: string;
  status: string;
  createdAt: string;
}

export interface CreateArrivalNotificationDTO {
  routeId: string;
  stopId: string;
  anticipationMinutes: 5 | 10 | 15;
  message?: string;
}

export interface ArrivalNotificationResponse {
  success?: boolean;
  message?: string;
  subscribed?: boolean;
  sent?: boolean;
  scheduled?: boolean;
  etaMinutes?: number;
  stopName?: string;
}

export interface ArrivalNotificationPayload {
  routeName?: string;
  plate?: string;
  etaMinutes?: number;
  stopName?: string;
  busId?: string;
  trackingPath?: string;
  paymentActionPath?: string;
  status?: {
    lat?: number;
    lng?: number;
    occupancyPercent?: number;
    isFull?: boolean;
    estimatedMinutesToWaitingStop?: number;
  };
}

export interface PaymentMethodCitizen {
  id: string;
  citizenId: string;
  paymentMethodId: string;
  balance?: number;
  citizen?: Pick<Citizen, "id" | "name" | "document">;
  paymentMethod?: Pick<PaymentMethod, "id" | "name" | "code" | "isRechargeable">;
  createdAt?: string;
}

export interface CreatePaymentMethodCitizenDTO {
  citizenId: string;
  paymentMethodId: string;
}

/** Self-service link: citizen id comes from JWT. */
export interface LinkMyPaymentMethodDTO {
  paymentMethodId: string;
}

export interface UpdatePaymentMethodCitizenDTO {
  citizenId?: string;
  paymentMethodId?: string;
}

export type {
  Incident,
  IncidentType,
  IncidentSeverity,
  IncidentStatus,
} from './Incident';
export {
  INCIDENT_TYPE_LABELS,
  INCIDENT_SEVERITY_LABELS,
  INCIDENT_SEVERITY_OPTIONS,
  INCIDENT_SEVERITY_RANK,
  INCIDENT_STATUS_LABELS,
  INCIDENT_TYPE_OPTIONS,
  INCIDENT_STATUS_OPTIONS,
  INCIDENT_STATUS_FLOW,
  formatIncidentDate,
  formatIncidentDateLong,
  formatIncidentRadicado,
  incidentTypeLabel,
  incidentSeverityLabel,
  incidentStatusLabel,
  truncateText,
} from './Incident';

export interface IncidentStatistics {
  total: number;
  byType: Record<string, number>;
  resolutionRate: number;
}

export interface BusIncidentList {
  items: Incident[];
  meta: import("@/core/types/BusinessPage").PaginationMeta;
  statistics: IncidentStatistics;
}

export interface IncidentComment {
  id: string;
  text: string;
  authorUserId?: string;
  authorName?: string;
  createdAt: string;
}

export interface CreateIncidentCommentDTO {
  text: string;
}

export interface UpdateIncidentStatusDTO {
  status: IncidentStatus;
}

export interface DashboardPeriod {
  start: string;
  end: string;
  months: number;
}

export interface PaymentMethodIncomeDataset {
  paymentMethodId: string;
  paymentMethodName: string;
  data: number[];
  totalIncome: number;
}

export interface PaymentMethodIncome {
  period: DashboardPeriod;
  labels: string[];
  datasets: PaymentMethodIncomeDataset[];
  grandTotal: number;
  excludedTicketsCount: number;
}

export interface IncidentTrendDataset {
  type: string;
  typeLabel: string;
  data: number[];
  total: number;
}

export interface IncidentTrend {
  period: DashboardPeriod;
  scope: { enterpriseId?: string; enterpriseName?: string };
  labels: string[];
  datasets: IncidentTrendDataset[];
  grandTotal: number;
}
