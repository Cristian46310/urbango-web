import { httpMsBussines } from "@/infra/api/builderHttp";
import { ENDPOINTS } from "@/infra/api/endpoints";
import type {
  BusIncidentList,
  CreateIncidentCommentDTO,
  Incident,
  IncidentComment,
  IncidentStatus,
  UpdateIncidentStatusDTO,
} from "@/core/domain/entities/business";
import type { BusinessPage, BusinessPageableQuery } from "@/core/types/BusinessPage";
import { mapIncidentFromApi, mapIncidentsFromApi } from "./incidentMapper";

export interface BusIncidentQuery extends BusinessPageableQuery {
  type?: string;
  status?: string;
}

export class IncidentRepository {
  async findAll(pageable: BusinessPageableQuery): Promise<BusinessPage<Incident>> {
    const page = await httpMsBussines.get<BusinessPage<Incident>>(ENDPOINTS.INCIDENT_REPORTS.LIST, {
      params: pageable,
    });
    return { ...page, items: mapIncidentsFromApi(page.items) };
  }

  /**
   * La API no expone GET por id; se busca en el listado paginado.
   */
  async findById(id: string): Promise<Incident | null> {
    const page = await this.findAll({ page: 1, limit: 100 });
    const found = page.items.find((item) => item.id === id);
    if (found) return found;

    const totalPages = page.meta?.totalPages ?? 1;
    for (let pageNum = 2; pageNum <= totalPages && pageNum <= 10; pageNum += 1) {
      const next = await this.findAll({ page: pageNum, limit: 100 });
      const match = next.items.find((item) => item.id === id);
      if (match) return match;
    }
    return null;
  }

  async findByBus(busId: string, query: BusIncidentQuery): Promise<BusIncidentList> {
    const result = await httpMsBussines.get<BusIncidentList>(ENDPOINTS.INCIDENT_REPORTS.BY_BUS(busId), {
      params: query,
    });
    return { ...result, items: mapIncidentsFromApi(result.items) };
  }

  async listComments(incidentId: string): Promise<IncidentComment[]> {
    const response = await httpMsBussines.get<{ items?: IncidentComment[] } | IncidentComment[]>(
      ENDPOINTS.INCIDENT_REPORTS.COMMENTS(incidentId),
    );
    if (Array.isArray(response)) return response;
    return response.items ?? [];
  }

  async addComment(incidentId: string, data: CreateIncidentCommentDTO): Promise<IncidentComment> {
    return await httpMsBussines.post<IncidentComment>(
      ENDPOINTS.INCIDENT_REPORTS.COMMENTS(incidentId),
      data,
    );
  }

  async updateStatus(incidentId: string, status: IncidentStatus): Promise<Incident> {
    const body: UpdateIncidentStatusDTO = { status };
    const updated = await httpMsBussines.put<Incident>(ENDPOINTS.INCIDENT_REPORTS.STATUS(incidentId), body);
    return mapIncidentFromApi(updated);
  }
}

export const incidentRepository = new IncidentRepository();
