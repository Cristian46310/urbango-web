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

export const addressRepository = new BusinessCrudRepository<
  Address,
  CreateAddressDTO,
  UpdateAddressDTO
>(ENDPOINTS.ADDRESS.BASE, ENDPOINTS.ADDRESS.BY_ID);

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
>(ENDPOINTS.DRIVER.BASE, ENDPOINTS.DRIVER.BY_ID);

export const routeRepository = new BusinessCrudRepository<
  Route,
  CreateRouteDTO,
  UpdateRouteDTO
>(ENDPOINTS.ROUTE.BASE, ENDPOINTS.ROUTE.BY_ID);

export const busRepository = new BusinessCrudRepository<Bus, CreateBusDTO, UpdateBusDTO>(
  ENDPOINTS.BUS.BASE,
  ENDPOINTS.BUS.BY_ID,
);

export const schedulerRepository = new BusinessCrudRepository<
  Scheduler,
  CreateSchedulerDTO,
  UpdateSchedulerDTO
>(ENDPOINTS.SCHEDULER.BASE, ENDPOINTS.SCHEDULER.BY_ID);

export const turnRepository = new BusinessCrudRepository<Turn, CreateTurnDTO, UpdateTurnDTO>(
  ENDPOINTS.TURN.BASE,
  ENDPOINTS.TURN.BY_ID,
);

export const paymentMethodCitizenRepository = new BusinessCrudRepository<
  PaymentMethodCitizen,
  CreatePaymentMethodCitizenDTO,
  UpdatePaymentMethodCitizenDTO
>(ENDPOINTS.PAYMENT_METHOD_CITIZEN.BASE, ENDPOINTS.PAYMENT_METHOD_CITIZEN.BY_ID);

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
