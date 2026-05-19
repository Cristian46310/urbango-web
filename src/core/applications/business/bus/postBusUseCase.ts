import type { Bus, CreateBusDTO } from '@/core/domain/entities/business/Bus';
import type { IBusRepository } from '@/core/domain/interfaces/business/IBusRepository';

export class PostBusUseCase {
  private busRepository: IBusRepository;

  constructor(busRepository: IBusRepository) {
    this.busRepository = busRepository;
  }

  execute(data: CreateBusDTO): Promise<Bus> {
    return this.busRepository.createBus(data);
  }
}
