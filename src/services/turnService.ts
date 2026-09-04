import type {
  CurrentTurn,
  EndTurnPayload,
  EndTurnResponse,
  StartTurnPayload,
  StartTurnResponse,
} from '@/core/domain/entities/business/Transit';
import { transitRepository } from '@/infra/repository/transit';
import type { LastTurnSummary } from '@/lib/lastTurnSummary';
import {
  clearLastTurnSummary,
  writeLastTurnSummary,
} from '@/lib/lastTurnSummary';

export type {
  CurrentTurn,
  EndTurnPayload,
  EndTurnResponse,
  StartTurnPayload,
  StartTurnResponse,
};

export function currentTurnToSummary(turn: CurrentTurn): LastTurnSummary {
  return {
    turnId: turn.turnId || turn.id,
    busPlate:
      turn.busPlate ||
      turn.bus?.plate ||
      turn.bus?.placa ||
      '',
    startTime: turn.startTime || '',
    status: turn.status,
    active: turn.active,
    busId: turn.busId,
    driverId: turn.driverId,
    endTime: turn.endTime,
  };
}

export function cacheCurrentTurn(turn: CurrentTurn) {
  if (turn.active && (turn.turnId || turn.id)) {
    writeLastTurnSummary(currentTurnToSummary(turn));
  } else {
    clearLastTurnSummary();
  }
}

export async function getCurrentTurn(): Promise<CurrentTurn> {
  return transitRepository.getCurrentTurn();
}

export async function startTurn(payload: StartTurnPayload): Promise<StartTurnResponse> {
  return transitRepository.startTurn(payload);
}

export async function endTurn(payload: EndTurnPayload): Promise<EndTurnResponse> {
  return transitRepository.endTurn(payload);
}

export async function updateBusGps(
  busId: string,
  latitude: number,
  longitude: number,
): Promise<void> {
  return transitRepository.updateBusGps(busId, latitude, longitude);
}

export async function updateTurnGps(
  latitude: number,
  longitude: number,
): Promise<void> {
  return transitRepository.updateTurnGps(latitude, longitude);
}
