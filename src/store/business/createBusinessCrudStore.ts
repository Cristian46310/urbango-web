import { create } from "zustand";
import { dismissToast, showErrorToast, showLoadingToast, showSuccessToast } from "@/lib/toast";
import type { BusinessCrudUseCases } from "@/core/applications/business/createBusinessCrudUseCases";
import type { BusinessPage, BusinessPageableQuery } from "@/core/types/BusinessPage";
import { BUSINESS_PAGE_SIZE } from "@/app/components/business/constants";

interface BusinessCrudStoreConfig {
  entityLabel: string;
}

export function createBusinessCrudStore<T extends { id: string }, CreateDto, UpdateDto>(
  useCases: BusinessCrudUseCases<T, CreateDto, UpdateDto>,
  config: BusinessCrudStoreConfig,
) {
  const label = config.entityLabel;

  return create<{
    items: T[];
    page: BusinessPage<T> | null;
    loading: boolean;
    error: string | null;
    fetchById: (id: string) => Promise<T>;
    fetchAll: (pageable?: BusinessPageableQuery) => Promise<BusinessPage<T>>;
    create: (data: CreateDto) => Promise<T>;
    update: (id: string, data: UpdateDto) => Promise<T>;
    remove: (id: string) => Promise<void>;
  }>((set) => ({
    items: [],
    page: null,
    loading: false,
    error: null,
    fetchById: async (id: string) => {
      const loadingToastId = showLoadingToast(`Cargando ${label}...`);
      set({ loading: true, error: null });
      try {
        const item = await useCases.getById(id);
        set({ loading: false });
        return item;
      } catch (error) {
        set({ loading: false, error: (error as Error).message });
        showErrorToast(`Error al cargar ${label}: ${(error as Error).message}`);
        throw error;
      } finally {
        dismissToast(loadingToastId);
      }
    },
    fetchAll: async (pageable = { page: 1, limit: BUSINESS_PAGE_SIZE }) => {
      const loadingToastId = showLoadingToast(`Cargando ${label}...`);
      set({ loading: true, error: null });
      try {
        const page = await useCases.getAll(pageable);
        set({ loading: false, items: page.items, page });
        return page;
      } catch (error) {
        set({ loading: false, error: (error as Error).message });
        showErrorToast(`Error al cargar ${label}: ${(error as Error).message}`);
        throw error;
      } finally {
        dismissToast(loadingToastId);
      }
    },
    create: async (data: CreateDto) => {
      const loadingToastId = showLoadingToast(`Creando ${label}...`);
      set({ loading: true, error: null });
      try {
        const item = await useCases.create(data);
        set({ loading: false });
        showSuccessToast(`${label} creado correctamente`);
        return item;
      } catch (error) {
        set({ loading: false, error: (error as Error).message });
        showErrorToast(`Error al crear ${label}: ${(error as Error).message}`);
        throw error;
      } finally {
        dismissToast(loadingToastId);
      }
    },
    update: async (id: string, data: UpdateDto) => {
      const loadingToastId = showLoadingToast(`Actualizando ${label}...`);
      set({ loading: true, error: null });
      try {
        const item = await useCases.update(id, data);
        set({ loading: false });
        showSuccessToast(`${label} actualizado correctamente`);
        return item;
      } catch (error) {
        set({ loading: false, error: (error as Error).message });
        showErrorToast(`Error al actualizar ${label}: ${(error as Error).message}`);
        throw error;
      } finally {
        dismissToast(loadingToastId);
      }
    },
    remove: async (id: string) => {
      const loadingToastId = showLoadingToast(`Eliminando ${label}...`);
      set({ loading: true, error: null });
      try {
        await useCases.delete(id);
        set({ loading: false });
        showSuccessToast(`${label} eliminado correctamente`);
      } catch (error) {
        set({ loading: false, error: (error as Error).message });
        showErrorToast(`Error al eliminar ${label}: ${(error as Error).message}`);
        throw error;
      } finally {
        dismissToast(loadingToastId);
      }
    },
  }));
}
