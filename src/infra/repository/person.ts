import { httpMsBussines } from '../api/builderHttp';
import { ENDPOINTS } from '../api/endpoints';

export type PersonProfileType = 'driver' | 'citizen' | 'supervisor';

export interface RegisterPersonPayload {
  name: string;
  document: string;
  email?: string;
  phone?: string;
  licenseNumber?: string;
  licenseExpiry?: string;
  extraInfo?: string;
  /** Obligatorio para conductor y supervisor. */
  enterpriseId?: string;
}

function profileEndpoint(type: PersonProfileType, me = false): string {
  if (type === 'driver') {
    return me ? ENDPOINTS.DRIVER.ME : ENDPOINTS.DRIVER.BASE;
  }
  if (type === 'supervisor') {
    return me ? ENDPOINTS.SUPERVISOR.ME : ENDPOINTS.SUPERVISOR.BASE;
  }
  return me ? ENDPOINTS.CITIZEN.ME : ENDPOINTS.CITIZEN.BASE;
}

export interface PersonProfileResponse {
  id: string;
  name?: string;
  document?: string;
  enterpriseId?: string;
  createdAt?: string;
}

export const personRepository = {
  async register(
    type: PersonProfileType,
    payload: RegisterPersonPayload,
  ): Promise<PersonProfileResponse> {
    return httpMsBussines.post<PersonProfileResponse>(
      profileEndpoint(type),
      payload,
    );
  },

  async getMyProfile(
    type: PersonProfileType,
  ): Promise<PersonProfileResponse | null> {
    try {
      return await httpMsBussines.get<PersonProfileResponse>(
        profileEndpoint(type, true),
      );
    } catch {
      return null;
    }
  },
};
