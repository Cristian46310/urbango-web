import { httpMsBussines } from '../api/builderHttp';
import { ENDPOINTS } from '../api/endpoints';

export interface Enterprise {
  id: string;
  name: string;
  nit: string;
  supervisorEmail?: string;
}

interface EnterpriseListResponse {
  items: Enterprise[];
}

export const enterpriseRepository = {
  async list(limit = 100): Promise<Enterprise[]> {
    const response = await httpMsBussines.get<EnterpriseListResponse>(
      ENDPOINTS.ENTERPRISE.BASE,
      { params: { page: 1, limit } },
    );
    return response.items;
  },
};
