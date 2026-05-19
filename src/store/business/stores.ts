import { createBusinessCrudUseCases } from "@/core/applications/business/createBusinessCrudUseCases";
import { createBusinessCrudStore } from "./createBusinessCrudStore";
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
import {
  addressRepository,
  busRepository,
  citizenRepository,
  driverRepository,
  enterpriseRepository,
  nodeRepository,
  paymentMethodCitizenRepository,
  paymentMethodRepository,
  routeRepository,
  schedulerRepository,
  stopAdminRepository,
  turnRepository,
} from "@/infra/repository/business/repositories";

export const useAddressStore = createBusinessCrudStore<Address, CreateAddressDTO, UpdateAddressDTO>(
  createBusinessCrudUseCases(addressRepository),
  { entityLabel: "dirección" },
);

export const useEnterpriseStore = createBusinessCrudStore<
  Enterprise,
  CreateEnterpriseDTO,
  UpdateEnterpriseDTO
>(createBusinessCrudUseCases(enterpriseRepository), { entityLabel: "empresa" });

export const useStopAdminStore = createBusinessCrudStore<Stop, CreateStopDTO, UpdateStopDTO>(
  createBusinessCrudUseCases(stopAdminRepository),
  { entityLabel: "parada" },
);

export const usePaymentMethodStore = createBusinessCrudStore<
  PaymentMethod,
  CreatePaymentMethodDTO,
  UpdatePaymentMethodDTO
>(createBusinessCrudUseCases(paymentMethodRepository), { entityLabel: "método de pago" });

export const useCitizenStore = createBusinessCrudStore<Citizen, CreateCitizenDTO, UpdateCitizenDTO>(
  createBusinessCrudUseCases(citizenRepository),
  { entityLabel: "ciudadano" },
);

export const useDriverAdminStore = createBusinessCrudStore<Driver, CreateDriverDTO, UpdateDriverDTO>(
  createBusinessCrudUseCases(driverRepository),
  { entityLabel: "conductor" },
);

export const useRouteStore = createBusinessCrudStore<Route, CreateRouteDTO, UpdateRouteDTO>(
  createBusinessCrudUseCases(routeRepository),
  { entityLabel: "ruta" },
);

export const useNodeStore = createBusinessCrudStore<Node, CreateNodeDTO, UpdateNodeDTO>(
  createBusinessCrudUseCases(nodeRepository),
  { entityLabel: "nodo" },
);

export const useBusStore = createBusinessCrudStore<Bus, CreateBusDTO, UpdateBusDTO>(
  createBusinessCrudUseCases(busRepository),
  { entityLabel: "bus" },
);

export const useSchedulerStore = createBusinessCrudStore<
  Scheduler,
  CreateSchedulerDTO,
  UpdateSchedulerDTO
>(createBusinessCrudUseCases(schedulerRepository), { entityLabel: "programación" });

export const useTurnStore = createBusinessCrudStore<Turn, CreateTurnDTO, UpdateTurnDTO>(
  createBusinessCrudUseCases(turnRepository),
  { entityLabel: "turno" },
);

export const usePaymentMethodCitizenStore = createBusinessCrudStore<
  PaymentMethodCitizen,
  CreatePaymentMethodCitizenDTO,
  UpdatePaymentMethodCitizenDTO
>(createBusinessCrudUseCases(paymentMethodCitizenRepository), { entityLabel: "pago ciudadano" });
