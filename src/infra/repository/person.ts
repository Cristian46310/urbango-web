import { httpMsBussines } from '../api/builderHttp';
import { ENDPOINTS } from '../api/endpoints';

export type PersonProfileType = 'driver' | 'citizen';

export interface RegisterPersonPayload {
  name: string;
  document: string;
  email?: string;
  phone?: string;
  licenseNumber?: string;
  licenseExpiry?: string;
  extraInfo?: string;
  /** Obligatorio al registrar conductor (POST /driver). */
  enterpriseId?: string;
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
    const endpoint =
      type === 'driver' ? ENDPOINTS.DRIVER.BASE : ENDPOINTS.CITIZEN.BASE;
    return httpMsBussines.post<PersonProfileResponse>(endpoint, payload);
  },

  async getMyProfile(
    type: PersonProfileType,
  ): Promise<PersonProfileResponse | null> {
    const endpoint =
      type === 'driver' ? ENDPOINTS.DRIVER.ME : ENDPOINTS.CITIZEN.ME;
    try {
      return await httpMsBussines.get<PersonProfileResponse>(endpoint);
    } catch {
      return null;
    }
  },
};
