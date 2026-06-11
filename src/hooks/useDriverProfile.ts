import { useCallback, useEffect, useState } from "react";

import { personRepository } from "@/infra/repository/person";

export function useDriverProfile() {
  const [hasDriverProfile, setHasDriverProfile] = useState<boolean | null>(null);

  const refresh = useCallback(async () => {
    const profile = await personRepository.getMyProfile("driver");
    setHasDriverProfile(Boolean(profile));
    return Boolean(profile);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    hasDriverProfile,
    loading: hasDriverProfile === null,
    refresh,
  };
}
