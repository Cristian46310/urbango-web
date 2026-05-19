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

export interface Stop {
  id: string;
  name: string;
  location: string;
  latitude: number;
  longitude: number;
  createdAt?: string;
}

export interface CreateStopDTO {
  name: string;
  location: string;
  latitude: number;
  longitude: number;
}

export interface UpdateStopDTO {
  name?: string;
  location?: string;
  latitude?: number;
  longitude?: number;
}

export interface PaymentMethod {
  id: string;
  name: string;
  createdAt?: string;
}

export interface CreatePaymentMethodDTO {
  name: string;
}

export interface UpdatePaymentMethodDTO {
  name?: string;
}

export interface Citizen {
  id: string;
  name: string;
  document: string;
  email?: string;
  phone?: string;
  extraInfo?: string;
  addressId?: string;
  createdAt?: string;
}

export interface CreateCitizenDTO {
  name: string;
  document: string;
  email?: string;
  phone?: string;
  extraInfo?: string;
  addressId?: string;
}

export interface UpdateCitizenDTO {
  name?: string;
  document?: string;
  email?: string;
  phone?: string;
  extraInfo?: string;
  addressId?: string;
}

export interface Driver {
  id: string;
  name: string;
  document?: string;
  email?: string;
  phone?: string;
  licenseNumber: string;
  licenseExpiry: string;
  createdAt?: string;
}

export interface CreateDriverDTO {
  name: string;
  document?: string;
  email?: string;
  phone?: string;
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
}

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

export interface Bus {
  id: string;
  plate: string;
  model: string;
  color: string;
  capacity: number;
  enterpriseId?: string;
  createdAt?: string;
}

export interface CreateBusDTO {
  plate: string;
  model: string;
  color: string;
  capacity: number;
  enterpriseId: string;
}

export interface UpdateBusDTO {
  plate?: string;
  model?: string;
  color?: string;
  capacity?: number;
  enterpriseId?: string;
}

export interface Scheduler {
  id: string;
  bus?: Bus;
  route?: Route;
  startTime: string;
  endTime: string;
  createdAt?: string;
}

export interface CreateSchedulerDTO {
  busId: string;
  routeId: string;
  startTime: string;
  endTime: string;
}

export interface UpdateSchedulerDTO {
  busId?: string;
  routeId?: string;
  startTime?: string;
  endTime?: string;
}

export interface Turn {
  id: string;
  startTime: string;
  endTime: string;
  status: string;
  busId?: string;
  driverId?: string;
  createdAt?: string;
}

export interface CreateTurnDTO {
  startTime: string;
  endTime: string;
  status: string;
  busId: string;
  driverId: string;
}

export interface UpdateTurnDTO {
  startTime?: string;
  endTime?: string;
  status?: string;
  busId?: string;
  driverId?: string;
}

export interface PaymentMethodCitizen {
  id: string;
  citizenId: string;
  paymentMethodId: string;
  createdAt?: string;
}

export interface CreatePaymentMethodCitizenDTO {
  citizenId: string;
  paymentMethodId: string;
}

export interface UpdatePaymentMethodCitizenDTO {
  citizenId?: string;
  paymentMethodId?: string;
}

export type IncidentType = "mechanical" | "accident" | "delay" | "passenger" | "other";
export type IncidentSeverity = "low" | "medium" | "high" | "critical";
export type IncidentStatus = "reported" | "in_review" | "closed";

export interface Incident {
  id: string;
  reportedAt: string;
  type: IncidentType;
  severity: IncidentSeverity;
  status: IncidentStatus;
  description: string;
  driver?: { id?: string; name?: string };
  photos?: { id: string; url?: string }[];
}

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
