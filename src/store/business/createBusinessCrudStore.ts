import { create } from "zustand";
import { dismissToast, showErrorToast, showLoadingToast, showSuccessToast } from "@/lib/toast";
import type { BusinessCrudUseCases } from "@/core/applications/business/createBusinessCrudUseCases";
import type { BusinessPage, BusinessPageableQuery } from "@/core/types/BusinessPage";
import { BUSINESS_PAGE_SIZE } from "@/app/components/business/constants";
import { getApiErrorMessage } from "@/lib/api-error";

interface BusinessCrudStoreConfig {
  entityLabel: string;
  createSuccessMessage?: string;
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
      const loadingToastId = showLoadingToast(`Cargando ${label}...`, `crud:load:${label}`);
      set({ loading: true, error: null });
      try {
        const item = await useCases.getById(id);
        set({ loading: false });
        return item;
      } catch (error) {
        // Load failures: inline DataTable banner only (no toast) — single source of truth.
        const msg = getApiErrorMessage(error, `Error al cargar ${label}`);
        set({ loading: false, error: msg });
        throw error;
      } finally {
        dismissToast(loadingToastId);
      }
    },
    fetchAll: async (pageable = { page: 1, limit: BUSINESS_PAGE_SIZE }) => {
      const loadingToastId = showLoadingToast(`Cargando ${label}...`, `crud:load:${label}`);
      set({ loading: true, error: null });
      try {
        const page = await useCases.getAll(pageable);
        set({ loading: false, items: page.items, page });
        return page;
      } catch (error) {
        // Load failures: inline DataTable banner only (no toast) — single source of truth.
        const msg = getApiErrorMessage(error, `Error al cargar ${label}`);
        set({ loading: false, error: msg });
        throw error;
      } finally {
        dismissToast(loadingToastId);
      }
    },
    create: async (data: CreateDto) => {
      const loadingToastId = showLoadingToast(`Creando ${label}...`, `crud:create:${label}`);
      set({ loading: true, error: null });
      try {
        const item = await useCases.create(data);
        set({ loading: false });
        showSuccessToast(
          config.createSuccessMessage ?? `${label} creado correctamente`,
          `crud:create-ok:${label}`,
        );
        return item;
      } catch (error) {
        // Mutations: toast only (cleared error so DataTable doesn't duplicate the message).
        const msg = getApiErrorMessage(error, `Error al crear ${label}`);
        set({ loading: false, error: null });
        showErrorToast(msg, `crud:create-err:${label}`);
        throw error;
      } finally {
        dismissToast(loadingToastId);
      }
    },
    update: async (id: string, data: UpdateDto) => {
      const loadingToastId = showLoadingToast(`Actualizando ${label}...`, `crud:update:${label}`);
      set({ loading: true, error: null });
      try {
        const item = await useCases.update(id, data);
        set({ loading: false });
        showSuccessToast(`${label} actualizado correctamente`, `crud:update-ok:${label}`);
        return item;
      } catch (error) {
        const msg = getApiErrorMessage(error, `Error al actualizar ${label}`);
        set({ loading: false, error: null });
        showErrorToast(msg, `crud:update-err:${label}`);
        throw error;
      } finally {
        dismissToast(loadingToastId);
      }
    },
    remove: async (id: string) => {
      const loadingToastId = showLoadingToast(`Eliminando ${label}...`, `crud:remove:${label}`);
      set({ loading: true, error: null });
      try {
        await useCases.delete(id);
        set((state) => ({
          loading: false,
          items: state.items.filter((item) => item.id !== id),
          page: state.page
            ? {
                ...state.page,
                items: state.page.items.filter((item) => item.id !== id),
                meta: {
                  ...state.page.meta,
                  totalItems: Math.max(0, state.page.meta.totalItems - 1),
                },
              }
            : null,
        }));
        // Soft-delete en backend: no hay restore/papelera.
        showSuccessToast(`${label} eliminado`, `crud:remove-ok:${label}`);
      } catch (error) {
        const msg = getApiErrorMessage(error, `Error al eliminar ${label}`);
        set({ loading: false, error: null });
        showErrorToast(msg, `crud:remove-err:${label}`);
        throw error;
      } finally {
        dismissToast(loadingToastId);
      }
    },
  }));
}
