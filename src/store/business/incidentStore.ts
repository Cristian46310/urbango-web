import { create } from "zustand";
import { dismissToast, showErrorToast, showLoadingToast, showSuccessToast } from "@/lib/toast";
import type {
  BusIncidentList,
  CreateIncidentCommentDTO,
  Incident,
  IncidentComment,
  IncidentStatus,
} from "@/core/domain/entities/business";
import type { BusinessPage, BusinessPageableQuery } from "@/core/types/BusinessPage";
import { incidentRepository, type BusIncidentQuery } from "@/infra/repository/business/IncidentRepository";
import { BUSINESS_PAGE_SIZE } from "@/app/components/business/constants";

export const useIncidentStore = create<{
  incidents: Incident[];
  incidentsPage: BusinessPage<Incident> | null;
  busIncidents: BusIncidentList | null;
  comments: IncidentComment[];
  loading: boolean;
  error: string | null;
  fetchAll: (pageable?: BusinessPageableQuery) => Promise<BusinessPage<Incident>>;
  fetchByBus: (busId: string, query?: Partial<BusIncidentQuery>) => Promise<BusIncidentList>;
  fetchComments: (incidentId: string) => Promise<IncidentComment[]>;
  addComment: (incidentId: string, data: CreateIncidentCommentDTO) => Promise<IncidentComment>;
  updateStatus: (incidentId: string, status: IncidentStatus) => Promise<Incident>;
}>((set) => ({
  incidents: [],
  incidentsPage: null,
  busIncidents: null,
  comments: [],
  loading: false,
  error: null,
  fetchAll: async (pageable = { page: 1, limit: BUSINESS_PAGE_SIZE }) => {
    const loadingToastId = showLoadingToast("Cargando incidentes...");
    set({ loading: true, error: null });
    try {
      const page = await incidentRepository.findAll(pageable);
      set({ loading: false, incidents: page.items, incidentsPage: page });
      return page;
    } catch (error) {
      set({ loading: false, error: (error as Error).message });
      showErrorToast(`Error al cargar incidentes: ${(error as Error).message}`);
      throw error;
    } finally {
      dismissToast(loadingToastId);
    }
  },
  fetchByBus: async (busId, query = {}) => {
    const loadingToastId = showLoadingToast("Cargando incidentes del bus...");
    set({ loading: true, error: null });
    try {
      const result = await incidentRepository.findByBus(busId, {
        page: query.page ?? 1,
        limit: query.limit ?? BUSINESS_PAGE_SIZE,
        type: query.type,
        status: query.status,
      });
      set({ loading: false, busIncidents: result, incidents: result.items });
      return result;
    } catch (error) {
      set({ loading: false, error: (error as Error).message });
      showErrorToast(`Error al cargar incidentes: ${(error as Error).message}`);
      throw error;
    } finally {
      dismissToast(loadingToastId);
    }
  },
  fetchComments: async (incidentId) => {
    const loadingToastId = showLoadingToast("Cargando comentarios...");
    set({ loading: true, error: null });
    try {
      const comments = await incidentRepository.listComments(incidentId);
      set({ loading: false, comments });
      return comments;
    } catch (error) {
      set({ loading: false, error: (error as Error).message });
      showErrorToast(`Error al cargar comentarios: ${(error as Error).message}`);
      throw error;
    } finally {
      dismissToast(loadingToastId);
    }
  },
  addComment: async (incidentId, data) => {
    const loadingToastId = showLoadingToast("Agregando comentario...");
    set({ loading: true, error: null });
    try {
      const comment = await incidentRepository.addComment(incidentId, data);
      set((state) => ({ loading: false, comments: [...state.comments, comment] }));
      showSuccessToast("Comentario agregado");
      return comment;
    } catch (error) {
      set({ loading: false, error: (error as Error).message });
      showErrorToast(`Error al agregar comentario: ${(error as Error).message}`);
      throw error;
    } finally {
      dismissToast(loadingToastId);
    }
  },
  updateStatus: async (incidentId, status) => {
    const loadingToastId = showLoadingToast("Actualizando estado...");
    set({ loading: true, error: null });
    try {
      const incident = await incidentRepository.updateStatus(incidentId, status);
      set({ loading: false });
      showSuccessToast("Estado actualizado");
      return incident;
    } catch (error) {
      set({ loading: false, error: (error as Error).message });
      showErrorToast(`Error al actualizar estado: ${(error as Error).message}`);
      throw error;
    } finally {
      dismissToast(loadingToastId);
    }
  },
}));
