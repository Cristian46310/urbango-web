import type {
  AlightPayload,
  AlightResponse,
  CitizenTicket,
  TicketPage,
  TripDetails,
} from '@/core/domain/entities/business/Transit';
import { transitRepository } from '@/infra/repository/transit';

export type { AlightPayload, AlightResponse, CitizenTicket, TicketPage, TripDetails };

export const myTickets = transitRepository.myTickets.bind(transitRepository);
export const alight = transitRepository.alight.bind(transitRepository);
export const getTripDetails = transitRepository.getTripDetails.bind(transitRepository);
export const getActiveTicketId = transitRepository.getActiveTicketId.bind(transitRepository);
export const clearActiveTicket = transitRepository.clearActiveTicket.bind(transitRepository);
