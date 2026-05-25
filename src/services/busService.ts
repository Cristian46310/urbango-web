import { transitRepository } from '@/infra/repository/transit';

export interface BusItem {
  id: string;
  plate: string;
  model?: string;
  capacity?: number;
  /** @deprecated use plate */
  placa?: string;
  /** @deprecated use capacity */
  capacidad?: number;
}

export async function getBuses(): Promise<BusItem[]> {
  const buses = await transitRepository.listBuses();
  return buses.map((bus) => ({
    ...bus,
    placa: bus.plate,
    capacidad: bus.capacity,
  }));
}
