import { useProfileStore } from "@/store";
import type { Profile } from "@/core/domain/entities/security/Profile";
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
    addProfile: (profileData: Profile) => createProfile(profileData),
    editProfile: (profileId: string, profileData: Profile) => updateProfile(profileId, profileData),
    removeProfile: (profileId: string) => deleteProfile(profileId),
  };
}
