import { toast } from "sonner";
import { create } from "zustand";
import type { Profile } from "@/core/domain/entities/security/Profile";
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
  createProfile: (profileData: Profile) => Promise<Profile>;
  updateProfile: (profileId: string, profileData: Profile) => Promise<Profile>;
  deleteProfile: (profileId: string) => Promise<void>;
}

export const useProfileStore = create<ProfileStoreState>((set) => ({
  profiles: [],
  loading: false,
  error: null,
  fetchProfile: async (profileId: string) => {
    set({ loading: true, error: null });
    try {
      if (!profileId || profileId.trim() === "") {
        set({ loading: false, error: "Profile ID is required" });
        toast.error("Profile ID is required");
        throw new Error("Profile ID is required");
      }
      const profile = await getProfileUseCase.execute(profileId);
      set({ loading: false });
      return profile;
    } catch (error) {
      set({ loading: false, error: (error as Error).message });
      toast.error(`Error fetching profile: ${(error as Error).message}`);
      throw error;
    }
  },
  fetchAllProfiles: async () => {
    set({ loading: true, error: null });
    try {
      const profiles = await getAllProfilesUseCase.execute();
      set({ loading: false, profiles });
      return profiles;
    } catch (error) {
      set({ loading: false, error: (error as Error).message });
      toast.error(`Error fetching profiles: ${(error as Error).message}`);
      throw error;
    }
  },
  createProfile: async (profileData: Profile) => {
    set({ loading: true, error: null });
    try {
      const profile = await postProfileUseCase.execute(profileData);
      set({ loading: false });
      return profile;
    } catch (error) {
      set({ loading: false, error: (error as Error).message });
      toast.error(`Error creating profile: ${(error as Error).message}`);
      throw error;
    }
  },
  updateProfile: async (profileId: string, profileData: Profile) => {
    set({ loading: true, error: null });
    try {
      if (!profileId || profileId.trim() === "") {
        set({ loading: false, error: "Profile ID is required" });
        toast.error("Profile ID is required");
        throw new Error("Profile ID is required");
      }
      const profile = await putProfileUseCase.execute(profileId, profileData);
      set({ loading: false });
      return profile;
    } catch (error) {
      set({ loading: false, error: (error as Error).message });
      toast.error(`Error updating profile: ${(error as Error).message}`);
      throw error;
    }
  },
  deleteProfile: async (profileId: string) => {
    set({ loading: true, error: null });
    try {
      if (!profileId || profileId.trim() === "") {
        set({ loading: false, error: "Profile ID is required" });
        toast.error("Profile ID is required");
        throw new Error("Profile ID is required");
      }
      await deleteProfileUseCase.execute(profileId);
      set({ loading: false });
    } catch (error) {
      set({ loading: false, error: (error as Error).message });
      toast.error(`Error deleting profile: ${(error as Error).message}`);
      throw error;
    }
  },
}));
