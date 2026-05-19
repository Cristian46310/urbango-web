import type { Bus, CreateBusDTO } from '@/core/domain/entities/business/Bus';

export interface IBusRepository {
  createBus(data: CreateBusDTO): Promise<Bus>;
  uploadBusPhoto(busId: string, file: File): Promise<Bus>;
}
