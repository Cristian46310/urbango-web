import { createBusinessCrudHook } from "./createBusinessCrudHook";
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
  useAddressStore,
  useBusStore,
  useCitizenStore,
  useDriverAdminStore,
  useEnterpriseStore,
  useNodeStore,
  usePaymentMethodCitizenStore,
  usePaymentMethodStore,
  useRouteStore,
  useSchedulerStore,
  useStopAdminStore,
  useTurnStore,
} from "@/store/business/stores";
import { useMemo } from "react";
import { useIncidentStore } from "@/store/business/incidentStore";
import { useDashboardStore } from "@/store/business/dashboardStore";
import { toBusinessPageableQuery } from "@/infra/repository/business/businessPageAdapter";
import { BUSINESS_PAGE_SIZE } from "@/app/components/business/constants";

export const useAddress = createBusinessCrudHook<Address, CreateAddressDTO, UpdateAddressDTO>(useAddressStore);
export const useEnterprise = createBusinessCrudHook<Enterprise, CreateEnterpriseDTO, UpdateEnterpriseDTO>(useEnterpriseStore);
export const useStopAdmin = createBusinessCrudHook<Stop, CreateStopDTO, UpdateStopDTO>(useStopAdminStore);
export const usePaymentMethod = createBusinessCrudHook<PaymentMethod, CreatePaymentMethodDTO, UpdatePaymentMethodDTO>(usePaymentMethodStore);
export const useCitizen = createBusinessCrudHook<Citizen, CreateCitizenDTO, UpdateCitizenDTO>(useCitizenStore);
export const useDriverAdmin = createBusinessCrudHook<Driver, CreateDriverDTO, UpdateDriverDTO>(useDriverAdminStore);
export const useRoute = createBusinessCrudHook<Route, CreateRouteDTO, UpdateRouteDTO>(useRouteStore);
export const useNode = createBusinessCrudHook<Node, CreateNodeDTO, UpdateNodeDTO>(useNodeStore);
export const useBus = createBusinessCrudHook<Bus, CreateBusDTO, UpdateBusDTO>(useBusStore);
export const useScheduler = createBusinessCrudHook<Scheduler, CreateSchedulerDTO, UpdateSchedulerDTO>(useSchedulerStore);
export const useTurn = createBusinessCrudHook<Turn, CreateTurnDTO, UpdateTurnDTO>(useTurnStore);
export const usePaymentMethodCitizen = createBusinessCrudHook<PaymentMethodCitizen, CreatePaymentMethodCitizenDTO, UpdatePaymentMethodCitizenDTO>(usePaymentMethodCitizenStore);

export function useIncident() {
  const store = useIncidentStore();
  return useMemo(
    () => ({
      incidents: store.incidents,
      incidentsPage: store.incidentsPage,
      busIncidents: store.busIncidents,
      currentIncident: store.currentIncident,
      comments: store.comments,
      loading: store.loading,
      detailLoading: store.detailLoading,
      error: store.error,
      loadIncidents: (pageIndex = 0, pageSize = BUSINESS_PAGE_SIZE) =>
        store.fetchAll(toBusinessPageableQuery(pageIndex, pageSize)),
      loadById: store.fetchById,
      loadByBus: store.fetchByBus,
      loadComments: store.fetchComments,
      addComment: store.addComment,
      changeStatus: store.updateStatus,
    }),
    [store],
  );
}

export function useDashboard() {
  const store = useDashboardStore();
  return useMemo(
    () => ({
      paymentIncome: store.paymentIncome,
      incidentTrend: store.incidentTrend,
      loading: store.loading,
      error: store.error,
      loadPaymentIncome: store.fetchPaymentIncome,
      loadIncidentTrend: store.fetchIncidentTrend,
      exportPaymentIncome: store.exportPaymentIncome,
      exportIncidentTrend: store.exportIncidentTrend,
    }),
    [store],
  );
}
