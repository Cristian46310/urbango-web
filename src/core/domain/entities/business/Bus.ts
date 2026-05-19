export type BusStatus = 'operativo' | 'mantenimiento' | 'fuera_de_servicio';

export interface Bus {
  id: string;
  plate: string;
  model?: string;
  color?: string;
  capacity?: number;
  year?: number;
  seatedCapacity?: number;
  standingCapacity?: number;
  status: BusStatus;
  photoUrl?: string;
  qrCode?: string;
  enterpriseId?: string;
  createdAt: string;
}

export interface CreateBusDTO {
  plate: string;
  model: string;
  year: number;
  capacity: number;
  status: BusStatus;
  seatedCapacity?: number;
  standingCapacity?: number;
  color?: string;
}

export const BUS_STATUS_LABELS: Record<BusStatus, string> = {
  operativo: 'Operativo',
  mantenimiento: 'Mantenimiento',
  fuera_de_servicio: 'Fuera de servicio',
};
