import { useCallback, useEffect, useState } from "react";

import { personRepository } from "@/infra/repository/person";

export function useCitizenProfile() {
  const [hasCitizenProfile, setHasCitizenProfile] = useState<boolean | null>(null);

  const refresh = useCallback(async () => {
    const profile = await personRepository.getMyProfile("citizen");
    setHasCitizenProfile(Boolean(profile));
    return Boolean(profile);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    hasCitizenProfile,
    loading: hasCitizenProfile === null,
    refresh,
  };
}
