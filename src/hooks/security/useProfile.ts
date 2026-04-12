import { useProfileStore } from "@/store";
import type { CreateProfileDTO, UpdateProfileDTO } from "@/core/domain/entities/security/Profile";
import type { PageableQuery } from "@/core/types/Page";
export function useProfile() {
  const {
    profiles,
    profilesPage,
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
    profilesPage,
    loading,
    error,
    loadProfiles: (pageable?: PageableQuery) => fetchAllProfiles(pageable),
    getProfileById: (profileId: string) => fetchProfile(profileId),
    addProfile: (profileData: CreateProfileDTO) => createProfile(profileData),
    editProfile: (profileId: string, profileData: UpdateProfileDTO) => updateProfile(profileId, profileData),
    removeProfile: (profileId: string) => deleteProfile(profileId),
  };
}
