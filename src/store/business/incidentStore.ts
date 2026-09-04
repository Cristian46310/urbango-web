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

function sortCommentsDesc(comments: IncidentComment[]): IncidentComment[] {
  return [...comments].sort((a, b) => {
    const aTime = new Date(a.createdAt).getTime();
    const bTime = new Date(b.createdAt).getTime();
    return bTime - aTime;
  });
}

export const useIncidentStore = create<{
  incidents: Incident[];
  incidentsPage: BusinessPage<Incident> | null;
  busIncidents: BusIncidentList | null;
  currentIncident: Incident | null;
  comments: IncidentComment[];
  loading: boolean;
  detailLoading: boolean;
  error: string | null;
  fetchAll: (pageable?: BusinessPageableQuery) => Promise<BusinessPage<Incident>>;
  fetchById: (incidentId: string) => Promise<Incident>;
  fetchByBus: (busId: string, query?: Partial<BusIncidentQuery>) => Promise<BusIncidentList>;
  fetchComments: (incidentId: string) => Promise<IncidentComment[]>;
  addComment: (incidentId: string, data: CreateIncidentCommentDTO) => Promise<IncidentComment>;
  updateStatus: (incidentId: string, status: IncidentStatus) => Promise<Incident>;
}>((set, get) => ({
  incidents: [],
  incidentsPage: null,
  busIncidents: null,
  currentIncident: null,
  comments: [],
  loading: false,
  detailLoading: false,
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
  fetchById: async (incidentId) => {
    set({ detailLoading: true, error: null });
    try {
      const cached = get().incidents.find((item) => item.id === incidentId)
        ?? (get().currentIncident?.id === incidentId ? get().currentIncident : null);

      if (cached) {
        set({ detailLoading: false, currentIncident: cached, error: null });
        return cached;
      }

      const incident = await incidentRepository.findById(incidentId);
      if (!incident) {
        const message = "Incidente no encontrado";
        set({ detailLoading: false, currentIncident: null, error: message });
        throw new Error(message);
      }

      set((state) => ({
        detailLoading: false,
        currentIncident: incident,
        incidents: state.incidents.some((item) => item.id === incident.id)
          ? state.incidents
          : [incident, ...state.incidents],
        error: null,
      }));
      return incident;
    } catch (error) {
      const message = (error as Error).message;
      set({ detailLoading: false, error: message });
      showErrorToast(`Error al cargar el incidente: ${message}`);
      throw error;
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
    set({ loading: true, error: null });
    try {
      const comments = sortCommentsDesc(await incidentRepository.listComments(incidentId));
      set({ loading: false, comments });
      return comments;
    } catch (error) {
      set({ loading: false, error: (error as Error).message });
      showErrorToast(`Error al cargar comentarios: ${(error as Error).message}`);
      throw error;
    }
  },
  addComment: async (incidentId, data) => {
    const loadingToastId = showLoadingToast("Agregando comentario...");
    set({ loading: true, error: null });
    try {
      const comment = await incidentRepository.addComment(incidentId, data);
      set((state) => ({
        loading: false,
        comments: sortCommentsDesc([comment, ...state.comments]),
      }));
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
      set((state) => ({
        loading: false,
        currentIncident: state.currentIncident?.id === incidentId
          ? { ...state.currentIncident, ...incident, status }
          : state.currentIncident,
        incidents: state.incidents.map((item) =>
          item.id === incidentId ? { ...item, ...incident, status } : item,
        ),
      }));
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
