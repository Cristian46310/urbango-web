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

export interface BusIncidentQuery extends BusinessPageableQuery {
  type?: string;
  status?: string;
}

export class IncidentRepository {
  async findAll(pageable: BusinessPageableQuery): Promise<BusinessPage<Incident>> {
    return await httpMsBussines.get<BusinessPage<Incident>>(ENDPOINTS.INCIDENT_REPORTS.LIST, {
      params: pageable,
    });
  }

  async findByBus(busId: string, query: BusIncidentQuery): Promise<BusIncidentList> {
    return await httpMsBussines.get<BusIncidentList>(ENDPOINTS.INCIDENT_REPORTS.BY_BUS(busId), {
      params: query,
    });
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
    return await httpMsBussines.patch<Incident>(ENDPOINTS.INCIDENT_REPORTS.STATUS(incidentId), body);
  }
}

export const incidentRepository = new IncidentRepository();
