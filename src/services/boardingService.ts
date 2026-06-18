import type { BoardingPayload, BoardingResponse } from '@/core/domain/entities/business/Transit';
import { transitRepository } from '@/infra/repository/transit';

export type { BoardingPayload, BoardingResponse };

export async function board(payload: BoardingPayload): Promise<BoardingResponse> {
  return transitRepository.board(payload);
}
