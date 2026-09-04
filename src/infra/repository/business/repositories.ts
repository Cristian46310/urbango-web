import { ENDPOINTS } from "@/infra/api/endpoints";
import { BusinessCrudRepository } from "./BusinessCrudRepository";
import { httpMsBussines } from "@/infra/api/builderHttp";
import type {
  Address,
  Bus,
  Citizen,
  CreateAddressDTO,
  CreateBusDTO,
  CreateCitizenDTO,
  CreateDriverDTO,
  CreateEnterpriseDTO,
  CreateNodeDTO,
  CreatePaymentMethodCitizenDTO,
  CreatePaymentMethodDTO,
  CreateRouteDTO,
  CreateSchedulerDTO,
  CreateStopDTO,
  CreateTurnDTO,
  Driver,
  Enterprise,
  Node,
  PaymentMethod,
  PaymentMethodCitizen,
  Route,
  Scheduler,
  SchedulerStatus,
  Stop,
  Turn,
  UpdateAddressDTO,
  UpdateBusDTO,
  UpdateCitizenDTO,
  UpdateDriverDTO,
  UpdateEnterpriseDTO,
  UpdateNodeDTO,
  UpdatePaymentMethodCitizenDTO,
  UpdatePaymentMethodDTO,
  UpdateRouteDTO,
  UpdateSchedulerDTO,
  UpdateStopDTO,
  UpdateTurnDTO,
} from "@/core/domain/entities/business";
import type { BusinessPage, BusinessPageableQuery } from "@/core/types/BusinessPage";
import type { IBusinessCrudRepository } from "@/core/domain/interfaces/business/IBusinessCrudRepository";

function asRecord(value: unknown): Record<string, unknown> | null {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
}

function toStringValue(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

/** Address updates use PUT (not PATCH) per ms-business contract. */
export const addressRepository = new BusinessCrudRepository<
  Address,
  CreateAddressDTO,
  UpdateAddressDTO
>(ENDPOINTS.ADDRESS.BASE, ENDPOINTS.ADDRESS.BY_ID, ENDPOINTS.ADDRESS.BASE, "put");

export const enterpriseRepository = new BusinessCrudRepository<
  Enterprise,
  CreateEnterpriseDTO,
  UpdateEnterpriseDTO
>(ENDPOINTS.ENTERPRISE.BASE, ENDPOINTS.ENTERPRISE.BY_ID);

export const stopAdminRepository = new BusinessCrudRepository<
  Stop,
  CreateStopDTO,
  UpdateStopDTO
>(ENDPOINTS.STOPS.BASE, ENDPOINTS.STOPS.BY_ID);

export const paymentMethodRepository = new BusinessCrudRepository<
  PaymentMethod,
  CreatePaymentMethodDTO,
  UpdatePaymentMethodDTO
>(ENDPOINTS.PAYMENT_METHOD.BASE, ENDPOINTS.PAYMENT_METHOD.BY_ID);

export const citizenRepository = new BusinessCrudRepository<
  Citizen,
  CreateCitizenDTO,
  UpdateCitizenDTO
>(ENDPOINTS.CITIZEN.BASE, ENDPOINTS.CITIZEN.BY_ID);

export const driverRepository = new BusinessCrudRepository<
  Driver,
  CreateDriverDTO,
  UpdateDriverDTO
>(
  ENDPOINTS.DRIVER.BASE,
  ENDPOINTS.DRIVER.BY_ID,
  ENDPOINTS.DRIVER.ADMIN,
);

export const routeRepository = new BusinessCrudRepository<
  Route,
  CreateRouteDTO,
  UpdateRouteDTO
>(ENDPOINTS.ROUTE.BASE, ENDPOINTS.ROUTE.BY_ID);

export const busRepository = new BusinessCrudRepository<Bus, CreateBusDTO, UpdateBusDTO>(
  ENDPOINTS.BUS.BASE,
  ENDPOINTS.BUS.BY_ID,
);

function mapBusSummary(raw: unknown): Bus | undefined {
  const record = asRecord(raw);
  if (!record) {
    return undefined;
  }
  const id = toStringValue(record.id);
  if (!id) {
    return undefined;
  }
  return {
    id,
    plate: toStringValue(record.plate),
    status: (toStringValue(record.status) || "operativo") as Bus["status"],
  };
}

function mapRouteSummary(raw: unknown): Route | undefined {
  const record = asRecord(raw);
  if (!record) {
    return undefined;
  }
  const id = toStringValue(record.id);
  if (!id) {
    return undefined;
  }
  return {
    id,
    name: toStringValue(record.name),
    description: toStringValue(record.description),
    price: Number(record.price) || 0,
  };
}

function mapScheduler(raw: unknown): Scheduler | null {
  const record = asRecord(raw);
  if (!record) {
    return null;
  }

  const id = toStringValue(record.id);
  if (!id) {
    return null;
  }

  const statusRaw = toStringValue(record.status);
  return {
    id,
    bus: mapBusSummary(record.bus),
    route: mapRouteSummary(record.route),
    date: toStringValue(record.date) || undefined,
    departureTime: toStringValue(record.departureTime ?? record.departure_time) || undefined,
    status: statusRaw ? (statusRaw as SchedulerStatus) : undefined,
    startTime: toStringValue(record.startTime) || undefined,
    endTime: toStringValue(record.endTime) || undefined,
    createdAt: toStringValue(record.createdAt) || undefined,
  };
}

class SchedulerRepository
  implements IBusinessCrudRepository<Scheduler, CreateSchedulerDTO, UpdateSchedulerDTO>
{
  async getById(id: string): Promise<Scheduler> {
    const raw = await httpMsBussines.get<unknown>(ENDPOINTS.SCHEDULER.BY_ID(id));
    return mapScheduler(raw) ?? { id };
  }

  async getAll(pageable: BusinessPageableQuery): Promise<BusinessPage<Scheduler>> {
    const page = await httpMsBussines.get<BusinessPage<unknown>>(ENDPOINTS.SCHEDULER.BASE, {
      params: pageable,
    });
    return {
      ...page,
      items: page.items
        .map(mapScheduler)
        .filter((item): item is Scheduler => item !== null),
    };
  }

  async create(data: CreateSchedulerDTO): Promise<Scheduler> {
    const raw = await httpMsBussines.post<unknown>(ENDPOINTS.SCHEDULER.BASE, data);
    return mapScheduler(raw) ?? { id: "", ...data };
  }

  async update(id: string, data: UpdateSchedulerDTO): Promise<Scheduler> {
    // ms-business registers PUT /scheduler/:id (not PATCH)
    const raw = await httpMsBussines.put<unknown>(ENDPOINTS.SCHEDULER.BY_ID(id), data);
    return mapScheduler(raw) ?? { id, ...data };
  }

  async delete(id: string): Promise<void> {
    await httpMsBussines.delete(ENDPOINTS.SCHEDULER.BY_ID(id));
  }
}

export const schedulerRepository = new SchedulerRepository();

function mapDriverSummary(raw: unknown): Pick<Driver, "id" | "name"> | undefined {
  const record = asRecord(raw);
  if (!record) {
    return undefined;
  }
  const id = toStringValue(record.id);
  if (!id) {
    return undefined;
  }
  return {
    id,
    name: toStringValue(record.name) || id,
  };
}

function mapTurnStatus(raw: string): Turn["status"] {
  if (
    raw === "scheduled" ||
    raw === "in_progress" ||
    raw === "completed" ||
    raw === "cancelled"
  ) {
    return raw;
  }
  if (raw === "active" || raw === "en_curso") return "in_progress";
  if (raw === "programado") return "scheduled";
  if (raw === "completado") return "completed";
  if (raw === "cancelado") return "cancelled";
  return "scheduled";
}

function mapTurn(raw: unknown): Turn | null {
  const record = asRecord(raw);
  if (!record) {
    return null;
  }

  const id = toStringValue(record.id);
  if (!id) {
    return null;
  }

  const bus = mapBusSummary(record.bus);
  const driver = mapDriverSummary(record.driver);
  const busId =
    toStringValue(record.busId ?? record.bus_id) || bus?.id || undefined;
  const driverId =
    toStringValue(record.driverId ?? record.driver_id) || driver?.id || undefined;

  return {
    id,
    startTime: toStringValue(record.startTime) || "",
    endTime: toStringValue(record.endTime) || "",
    status: mapTurnStatus(toStringValue(record.status) || "scheduled"),
    busId,
    driverId,
    bus,
    driver,
    createdAt: toStringValue(record.createdAt) || undefined,
  };
}

class TurnRepository
  implements IBusinessCrudRepository<Turn, CreateTurnDTO, UpdateTurnDTO>
{
  async getById(id: string): Promise<Turn> {
    const raw = await httpMsBussines.get<unknown>(ENDPOINTS.TURN.BY_ID(id));
    return mapTurn(raw) ?? { id, startTime: "", endTime: "", status: "scheduled" };
  }

  async getAll(pageable: BusinessPageableQuery): Promise<BusinessPage<Turn>> {
    const page = await httpMsBussines.get<BusinessPage<unknown>>(ENDPOINTS.TURN.BASE, {
      params: pageable,
    });
    return {
      ...page,
      items: page.items.map(mapTurn).filter((item): item is Turn => item !== null),
    };
  }

  async create(data: CreateTurnDTO): Promise<Turn> {
    const raw = await httpMsBussines.post<unknown>(ENDPOINTS.TURN.BASE, data);
    return (
      mapTurn(raw) ?? {
        id: "",
        startTime: data.startTime,
        endTime: data.endTime,
        status: data.status ?? "scheduled",
        busId: data.busId,
        driverId: data.driverId,
      }
    );
  }

  async update(id: string, data: UpdateTurnDTO): Promise<Turn> {
    // ms-business registers PUT /turn/:id (not PATCH)
    const raw = await httpMsBussines.put<unknown>(ENDPOINTS.TURN.BY_ID(id), data);
    return (
      mapTurn(raw) ?? {
        id,
        startTime: data.startTime ?? "",
        endTime: data.endTime ?? "",
        status: data.status ?? "scheduled",
        busId: data.busId,
        driverId: data.driverId,
      }
    );
  }

  async delete(id: string): Promise<void> {
    await httpMsBussines.delete(ENDPOINTS.TURN.BY_ID(id));
  }
}

export const turnRepository = new TurnRepository();

function mapPaymentMethodCitizen(raw: unknown): PaymentMethodCitizen | null {
  const record = asRecord(raw);
  if (!record) {
    return null;
  }

  const id = toStringValue(record.id);
  if (!id) {
    return null;
  }

  const citizen = asRecord(record.citizen);
  const paymentMethod = asRecord(record.paymentMethod ?? record.payment_method);

  const citizenId = toStringValue(
    record.citizenId ?? record.citizen_id ?? citizen?.id,
  );
  const paymentMethodId = toStringValue(
    record.paymentMethodId ?? record.payment_method_id ?? paymentMethod?.id,
  );

  const balanceRaw = record.balance ?? record.currentBalance;
  const balance =
    typeof balanceRaw === "number" && Number.isFinite(balanceRaw)
      ? balanceRaw
      : typeof balanceRaw === "string" && balanceRaw.trim() !== ""
        ? Number(balanceRaw)
        : undefined;

  return {
    id,
    citizenId,
    paymentMethodId,
    balance: typeof balance === "number" && Number.isFinite(balance) ? balance : undefined,
    citizen: citizen
      ? {
          id: toStringValue(citizen.id),
          name: toStringValue(citizen.name),
          document: toStringValue(citizen.document),
        }
      : undefined,
    paymentMethod: paymentMethod
      ? {
          id: toStringValue(paymentMethod.id),
          name: toStringValue(paymentMethod.name),
          code: (toStringValue(paymentMethod.code) || undefined) as
            | PaymentMethod["code"]
            | undefined,
          isRechargeable:
            paymentMethod.isRechargeable !== undefined
              ? Boolean(paymentMethod.isRechargeable)
              : toStringValue(paymentMethod.code) === "SYSTEM_CARD",
        }
      : undefined,
    createdAt: toStringValue(record.createdAt) || undefined,
  };
}

class PaymentMethodCitizenRepository
  implements
    IBusinessCrudRepository<
      PaymentMethodCitizen,
      CreatePaymentMethodCitizenDTO,
      UpdatePaymentMethodCitizenDTO
    >
{
  async getById(id: string): Promise<PaymentMethodCitizen> {
    const raw = await httpMsBussines.get<unknown>(ENDPOINTS.PAYMENT_METHOD_CITIZEN.BY_ID(id));
    return mapPaymentMethodCitizen(raw) ?? { id, citizenId: "", paymentMethodId: "" };
  }

  async getAll(pageable: BusinessPageableQuery): Promise<BusinessPage<PaymentMethodCitizen>> {
    const page = await httpMsBussines.get<BusinessPage<unknown>>(ENDPOINTS.PAYMENT_METHOD_CITIZEN.BASE, {
      params: pageable,
    });
    return {
      ...page,
      items: page.items
        .map(mapPaymentMethodCitizen)
        .filter((item): item is PaymentMethodCitizen => item !== null),
    };
  }

  async create(data: CreatePaymentMethodCitizenDTO): Promise<PaymentMethodCitizen> {
    const raw = await httpMsBussines.post<unknown>(ENDPOINTS.PAYMENT_METHOD_CITIZEN.BASE, data);
    return mapPaymentMethodCitizen(raw) ?? { id: "", citizenId: data.citizenId, paymentMethodId: data.paymentMethodId };
  }

  async update(id: string, data: UpdatePaymentMethodCitizenDTO): Promise<PaymentMethodCitizen> {
    const raw = await httpMsBussines.patch<unknown>(ENDPOINTS.PAYMENT_METHOD_CITIZEN.BY_ID(id), data);
    return mapPaymentMethodCitizen(raw) ?? { id, citizenId: data.citizenId ?? "", paymentMethodId: data.paymentMethodId ?? "" };
  }

  async delete(id: string): Promise<void> {
    await httpMsBussines.delete(ENDPOINTS.PAYMENT_METHOD_CITIZEN.BY_ID(id));
  }
}

export const paymentMethodCitizenRepository = new PaymentMethodCitizenRepository();

class NodeRepository implements IBusinessCrudRepository<Node, CreateNodeDTO, UpdateNodeDTO> {
  async getById(id: string): Promise<Node> {
    const node = await httpMsBussines.get<Node>(ENDPOINTS.NODE.BY_ID(id));
    return { ...node, id: node.id || id };
  }

  async getAll(pageable: BusinessPageableQuery): Promise<BusinessPage<Node>> {
    const page = await httpMsBussines.get<BusinessPage<Node>>(ENDPOINTS.NODE.BASE, {
      params: pageable,
    });
    return {
      ...page,
      items: page.items.map((item, index) => ({
        ...item,
        id: item.id || `${item.routeId}-${item.stopId}-${String(item.order)}-${String(index)}`,
      })),
    };
  }

  async create(data: CreateNodeDTO): Promise<Node> {
    return await httpMsBussines.post<Node>(
      ENDPOINTS.NODE.BY_ROUTE_STOP(data.routeId, data.stopId),
      { order: data.order },
    );
  }

  async update(id: string, data: UpdateNodeDTO): Promise<Node> {
    return await httpMsBussines.patch<Node>(ENDPOINTS.NODE.BY_ID(id), data);
  }

  async delete(id: string): Promise<void> {
    await httpMsBussines.delete(ENDPOINTS.NODE.BY_ID(id));
  }
}

export const nodeRepository = new NodeRepository();
