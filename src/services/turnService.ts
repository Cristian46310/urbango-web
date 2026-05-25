import type { StartTurnPayload, StartTurnResponse } from '@/core/domain/entities/business/Transit';
import { transitRepository } from '@/infra/repository/transit';

export type { StartTurnPayload, StartTurnResponse };

export async function startTurn(payload: StartTurnPayload): Promise<StartTurnResponse> {
  return transitRepository.startTurn(payload);
}

export async function updateBusGps(
  busId: string,
  latitude: number,
  longitude: number,
): Promise<void> {
  return transitRepository.updateBusGps(busId, latitude, longitude);
}
