import type { Bus } from '@/core/domain/entities/business/Bus';
import type { IBusRepository } from '@/core/domain/interfaces/business/IBusRepository';

export class UploadBusPhotoUseCase {
  private busRepository: IBusRepository;

  constructor(busRepository: IBusRepository) {
    this.busRepository = busRepository;
  }

  execute(busId: string, file: File): Promise<Bus> {
    return this.busRepository.uploadBusPhoto(busId, file);
  }
}
