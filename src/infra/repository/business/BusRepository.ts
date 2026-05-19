import type { Bus, CreateBusDTO } from '@/core/domain/entities/business/Bus';
import type { IBusRepository } from '@/core/domain/interfaces/business/IBusRepository';
import { httpMsBussines } from '@/infra/api/builderHttp';
import { ENDPOINTS } from '@/infra/api/endpoints';

export class BusRepository implements IBusRepository {
  async createBus(data: CreateBusDTO): Promise<Bus> {
    return httpMsBussines.post<Bus>(ENDPOINTS.BUS.BASE, data);
  }

  async uploadBusPhoto(busId: string, file: File): Promise<Bus> {
    const form = new FormData();
    form.append('photo', file, file.name);
    return httpMsBussines.post<Bus>(ENDPOINTS.BUS.PHOTO(busId), form);
  }
}

export const busRepository = new BusRepository();
