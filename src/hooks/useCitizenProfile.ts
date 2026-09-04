import { useCallback, useEffect, useState } from "react";

import {
  personRepository,
  type PersonProfileResponse,
} from "@/infra/repository/person";

export function useCitizenProfile() {
  const [citizenProfile, setCitizenProfile] = useState<PersonProfileResponse | null>(null);
  const [hasCitizenProfile, setHasCitizenProfile] = useState<boolean | null>(null);

  const refresh = useCallback(async () => {
    const profile = await personRepository.getMyProfile("citizen");
    setCitizenProfile(profile);
    setHasCitizenProfile(Boolean(profile));
    return Boolean(profile);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    citizenProfile,
    hasCitizenProfile,
    loading: hasCitizenProfile === null,
    refresh,
  };
}
