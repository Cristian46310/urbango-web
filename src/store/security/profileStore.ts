import { create } from "zustand";
import { dismissToast, showErrorToast, showLoadingToast, showSuccessToast } from "@/lib/toast";
import type { CreateProfileDTO, Profile, UpdateProfileDTO } from "@/core/domain/entities/security/Profile";
import { GetProfileUseCase } from "@/core/applications/security/profile/getProfileUseCase";
import { GetAllProfilesUseCase } from "@/core/applications/security/profile/getAllProfilesUseCase";
import { PostProfileUseCase } from "@/core/applications/security/profile/postProfileUseCase";
import { PutProfileUseCase } from "@/core/applications/security/profile/putProfileUseCase";
import { DeleteProfileUseCase } from "@/core/applications/security/profile/deleteProfileUseCase";
import { ProfileRepository } from "@/infra/repository/security";

const profileRepository = new ProfileRepository();
const getProfileUseCase = new GetProfileUseCase(profileRepository);
const getAllProfilesUseCase = new GetAllProfilesUseCase(profileRepository);
const postProfileUseCase = new PostProfileUseCase(profileRepository);
const putProfileUseCase = new PutProfileUseCase(profileRepository);
const deleteProfileUseCase = new DeleteProfileUseCase(profileRepository);

interface ProfileStoreState {
  profiles: Profile[];
  loading: boolean;
  error: string | null;
  fetchProfile: (profileId: string) => Promise<Profile>;
  fetchAllProfiles: () => Promise<Profile[]>;
  createProfile: (profileData: CreateProfileDTO) => Promise<Profile>;
  updateProfile: (profileId: string, profileData: UpdateProfileDTO) => Promise<Profile>;
  deleteProfile: (profileId: string) => Promise<void>;
}

export const useProfileStore = create<ProfileStoreState>((set) => ({
  profiles: [],
  loading: false,
  error: null,
  fetchProfile: async (profileId: string) => {
    const loadingToastId = showLoadingToast("Cargando perfil...");
    set({ loading: true, error: null });
    try {
      if (!profileId || profileId.trim() === "") {
        set({ loading: false, error: "Profile ID is required" });
        showErrorToast("Profile ID is required");
        throw new Error("Profile ID is required");
      }
      const profile = await getProfileUseCase.execute(profileId);
      set({ loading: false });
      return profile;
    } catch (error) {
      set({ loading: false, error: (error as Error).message });
      showErrorToast(`Error fetching profile: ${(error as Error).message}`);
      throw error;
    } finally {
      dismissToast(loadingToastId);
    }
  },
  fetchAllProfiles: async () => {
    const loadingToastId = showLoadingToast("Cargando perfiles...");
    set({ loading: true, error: null });
    try {
      const profiles = await getAllProfilesUseCase.execute();
      set({ loading: false, profiles });
      return profiles;
    } catch (error) {
      set({ loading: false, error: (error as Error).message });
      showErrorToast(`Error fetching profiles: ${(error as Error).message}`);
      throw error;
    } finally {
      dismissToast(loadingToastId);
    }
  },
  createProfile: async (profileData: CreateProfileDTO) => {
    const loadingToastId = showLoadingToast("Creando perfil...");
    set({ loading: true, error: null });
    try {
      const profile = await postProfileUseCase.execute(profileData);
      set({ loading: false });
      showSuccessToast("Profile created successfully");
      return profile;
    } catch (error) {
      set({ loading: false, error: (error as Error).message });
      showErrorToast(`Error creating profile: ${(error as Error).message}`);
      throw error;
    } finally {
      dismissToast(loadingToastId);
    }
  },
  updateProfile: async (profileId: string, profileData: UpdateProfileDTO) => {
    const loadingToastId = showLoadingToast("Actualizando perfil...");
    set({ loading: true, error: null });
    try {
      if (!profileId || profileId.trim() === "") {
        set({ loading: false, error: "Profile ID is required" });
        showErrorToast("Profile ID is required");
        throw new Error("Profile ID is required");
      }
      const profile = await putProfileUseCase.execute(profileId, profileData);
      set({ loading: false });
      showSuccessToast("Profile updated successfully");
      return profile;
    } catch (error) {
      set({ loading: false, error: (error as Error).message });
      showErrorToast(`Error updating profile: ${(error as Error).message}`);
      throw error;
    } finally {
      dismissToast(loadingToastId);
    }
  },
  deleteProfile: async (profileId: string) => {
    const loadingToastId = showLoadingToast("Eliminando perfil...");
    set({ loading: true, error: null });
    try {
      if (!profileId || profileId.trim() === "") {
        set({ loading: false, error: "Profile ID is required" });
        showErrorToast("Profile ID is required");
        throw new Error("Profile ID is required");
      }
      await deleteProfileUseCase.execute(profileId);
      set({ loading: false });
      showSuccessToast("Profile deleted successfully");
    } catch (error) {
      set({ loading: false, error: (error as Error).message });
      showErrorToast(`Error deleting profile: ${(error as Error).message}`);
      throw error;
    } finally {
      dismissToast(loadingToastId);
    }
  },
}));
