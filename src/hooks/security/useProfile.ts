import { useProfileStore } from "@/store";
import type { CreateProfileDTO, UpdateProfileDTO } from "@/core/domain/entities/security/Profile";
export function useProfile() {
  const {
    profiles,
    loading,
    error,
    fetchProfile,
    fetchAllProfiles,
    createProfile,
    updateProfile,
    deleteProfile,
  } = useProfileStore();


  return {
    profiles,
    loading,
    error,
    loadProfiles: () => fetchAllProfiles(),
    getProfileById: (profileId: string) => fetchProfile(profileId),
    addProfile: (profileData: CreateProfileDTO) => createProfile(profileData),
    editProfile: (profileId: string, profileData: UpdateProfileDTO) => updateProfile(profileId, profileData),
    removeProfile: (profileId: string) => deleteProfile(profileId),
  };
}
