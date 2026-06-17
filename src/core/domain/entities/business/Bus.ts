export type BusStatus = 'operativo' | 'mantenimiento' | 'fuera_de_servicio';

export interface Bus {
  id: string;
  plate: string;
  model?: string;
  color?: string;
  /** Capacidad total (puede venir calculada en respuestas). */
  capacity?: number;
  year?: number;
  seatedCapacity?: number;
  standingCapacity?: number;
  status: BusStatus;
  photoUrl?: string;
  qrCode?: string;
  enterpriseId?: string;
  createdAt?: string;
}

export interface CreateBusDTO {
  plate: string;
  color: string;
  model: string;
  year: number;
  seatedCapacity: number;
  standingCapacity: number;
  status: BusStatus;
}

export interface UpdateBusDTO {
  plate?: string;
  model?: string;
  year?: number;
  status?: BusStatus;
  seatedCapacity?: number;
  standingCapacity?: number;
  color?: string;
}

export const BUS_STATUS_LABELS: Record<BusStatus, string> = {
  operativo: 'Operativo',
  mantenimiento: 'Mantenimiento',
  fuera_de_servicio: 'Fuera de servicio',
};

export const BUS_STATUS_OPTIONS: BusStatus[] = [
  'operativo',
  'mantenimiento',
  'fuera_de_servicio',
];
