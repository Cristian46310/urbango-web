import { httpMsBussines } from '../api/builderHttp';
import { ENDPOINTS } from '../api/endpoints';
import type { CitizenAddress, CitizenAddressInput } from '@/core/domain/entities/business';

export type PersonProfileType = 'driver' | 'citizen' | 'supervisor';

/** Types that support multipart photo upload on `/me/photo`. */
export type PersonPhotoType = 'driver' | 'citizen';

export const PERSON_PHOTO_MAX_BYTES = 5 * 1024 * 1024;
export const PERSON_PHOTO_ACCEPT = 'image/jpeg,image/png,image/webp';

export interface RegisterPersonPayload {
  name: string;
  document: string;
  email?: string;
  phone?: string;
  birthDate?: string;
  /** Nested domicile for citizen — do not send with addressId. */
  address?: CitizenAddressInput;
  /** @deprecated Prefer nested `address`. */
  addressId?: string;
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

function photoEndpoint(type: PersonPhotoType): string {
  return type === 'driver' ? ENDPOINTS.DRIVER.ME_PHOTO : ENDPOINTS.CITIZEN.ME_PHOTO;
}

export interface PersonProfileResponse {
  id: string;
  name?: string;
  document?: string;
  email?: string;
  phone?: string;
  birthDate?: string;
  addressId?: string;
  address?: CitizenAddress | null;
  licenseNumber?: string;
  licenseExpiry?: string;
  enterpriseId?: string;
  /** URL pública de la foto (ms-business). No existe en security `/me`. */
  photoUrl?: string | null;
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

  async update(
    type: PersonProfileType,
    id: string,
    payload: RegisterPersonPayload,
  ): Promise<PersonProfileResponse> {
    const base =
      type === 'driver'
        ? ENDPOINTS.DRIVER.BY_ID(id)
        : type === 'supervisor'
          ? ENDPOINTS.SUPERVISOR.BY_ID(id)
          : ENDPOINTS.CITIZEN.BY_ID(id);
    return httpMsBussines.put<PersonProfileResponse>(base, payload);
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

  /**
   * Upload / replace photo after the person profile exists.
   * POST multipart field `photo` → `/citizen/me/photo` or `/driver/me/photo`.
   * Do not set Content-Type; the browser adds the multipart boundary.
   */
  async uploadMyPhoto(
    type: PersonPhotoType,
    file: File,
  ): Promise<PersonProfileResponse> {
    const form = new FormData();
    form.append('photo', file, file.name);
    return httpMsBussines.post<PersonProfileResponse>(photoEndpoint(type), form);
  },

  /** DELETE `/citizen/me/photo` or `/driver/me/photo`. */
  async deleteMyPhoto(type: PersonPhotoType): Promise<PersonProfileResponse> {
    return httpMsBussines.delete<PersonProfileResponse>(photoEndpoint(type));
  },
};
